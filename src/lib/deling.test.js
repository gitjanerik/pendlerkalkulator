import { describe, expect, it } from 'vitest'
import { brukDeling, delingsParametre, delingsUrl, lesDeling } from './deling.js'
import { standardModell } from './modell.js'
import { PRESETS, strekningFraPreset } from './presets.js'
import { prisErGamle, visJanuarVarsel } from './priser.js'

const modell = () => standardModell('2026-10-04')
const egen = { id: 'egen-1', navn: 'Stokke–Oslo S', bil: false, ruter: false, enkelt: 190, lufthavn: 330, tillegg: '', flyplass: 'bak', enturId: 'NSR:StopPlace:1', tilEnturId: '', perioder: [{ dager: 7, pris: 900 }, { dager: 30, pris: 2300 }] }

describe('deling', () => {
  it('forhåndsvalg deles bare som id', () => {
    const m = modell()
    m.strekninger = [strekningFraPreset(PRESETS[1], PRESETS[1].id)]
    expect(delingsUrl(m, 'https://x/')).toBe('https://x/?s=drammen')
  })

  it('endrede priser på et forhåndsvalg deles med prisdato', () => {
    const m = modell()
    m.strekninger[0].perioder[0].pris = 999
    const q = delingsParametre(m)
    expect(q.get('s')[0]).toBe('{')
    expect(q.get('pd')).toBe('2026-10-04')
    const d = lesDeling(q.toString())
    expect(d.hoved.id).toBe('gulskogen')
    expect(d.hoved.perioder[0].pris).toBe(999)
  })

  it('nye priser fra en dato følger med, også på et uendret forhåndsvalg', () => {
    const m = modell()
    m.nyePriser = { paa: true, dato: '2027-01-15' }
    m.strekninger[0].nye = { enkelt: '', lufthavn: '', perioder: [{ dager: 365, pris: 21500 }] }
    const q = delingsParametre(m)
    expect(q.get('nd')).toBe('2027-01-15')
    const d = lesDeling(q.toString())
    expect(d.nyDato).toBe('2027-01-15')
    expect(d.hoved.perioder.find((p) => p.dager === 365).ny).toBe(21500)
    const ut = brukDeling(modell(), d)
    expect(ut.nyePriser).toEqual({ paa: true, dato: '2027-01-15' })
  })

  it('uten bryter deles ingen nye priser', () => {
    const m = modell()
    m.nyePriser = { paa: false, dato: '2027-01-15' }
    m.strekninger[0].nye = { perioder: [{ dager: 365, pris: 21500 }] }
    expect(delingsParametre(m).get('s')).toBe('gulskogen')
    expect(delingsParametre(m).get('nd')).toBeNull()
  })

  it('egen strekning går rundt og havner blant mottakerens egne', () => {
    const m = modell()
    m.strekninger = [egen]
    const d = lesDeling(delingsParametre(m).toString())
    const mottaker = brukDeling(modell(), d)
    expect(mottaker.strekninger[0]).toMatchObject({ navn: 'Stokke–Oslo S', enkelt: 190, lufthavn: 330, flyplass: 'bak' })
    expect(mottaker.egneStasjoner).toHaveLength(1)
    expect(mottaker.strekninger[0].id).toBe(mottaker.egneStasjoner[0].id)
    expect(mottaker.oppsettFerdig).toBe(true)
    const igjen = brukDeling(mottaker, d)
    expect(igjen.egneStasjoner).toHaveLength(1)
  })

  it('tar med andre strekning og ukedager, men ikke ferie, fritid eller billett', () => {
    const m = modell()
    m.andreRute = { strekning: strekningFraPreset(PRESETS[1], 'drammen'), ukedager: [0, 2] }
    m.ferie = [{ fra: '2026-12-01', til: '2026-12-05' }]
    m.fritidsreiser = [{ fra: '2026-11-01', til: '2026-11-03' }]
    m.eksisterende = { paa: true, type: 'maaned', til: '2026-11-01', klokke: '07:00' }
    const q = delingsParametre(m).toString()
    expect(q).toBe('s=gulskogen&s2=drammen&d2=02')
    const ut = brukDeling(modell(), lesDeling(q))
    expect(ut.andreRute.ukedager).toEqual([0, 2])
    expect(ut.ferie).toEqual([])
    expect(ut.eksisterende.paa).toBe(false)
  })

  it('ugyldige lenker gir null', () => {
    expect(lesDeling('')).toBeNull()
    expect(lesDeling('?s=finnesikke')).toBeNull()
    expect(lesDeling('?s={ødelagt')).toBeNull()
    expect(lesDeling('?s=' + encodeURIComponent('{"n":"A","p":[]}'))).toBeNull()
  })
})

describe('priser: alder og januar-varsel', () => {
  it('gamle priser etter tre måneder', () => {
    expect(prisErGamle('2026-10-04', '2027-01-04')).toBe(false)
    expect(prisErGamle('2026-10-04', '2027-01-05')).toBe(true)
  })

  it('januar-varsel vises i januar, men ikke når lukket eller nylig registrert', () => {
    expect(visJanuarVarsel('2026-10-04', '', '2027-01-10')).toBe(true)
    expect(visJanuarVarsel('2026-10-04', '2027', '2027-01-10')).toBe(false)
    expect(visJanuarVarsel('2027-01-03', '', '2027-01-10')).toBe(false)
    expect(visJanuarVarsel('2026-10-04', '', '2026-12-31')).toBe(false)
    expect(visJanuarVarsel('2026-10-04', '2027', '2028-01-02')).toBe(true)
  })
})
