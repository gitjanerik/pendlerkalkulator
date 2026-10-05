import { describe, it, expect } from 'vitest'
import { OSL_TILLEGG, byggFritidsturer, flyplassForhold, fritidGrunnpris } from './fritid.js'
import { PRESETS } from './presets.js'
import { beregn, standardModell } from './modell.js'

const ramme = { fra: '2026-10-02', til: '2026-12-18', fraKlokke: '16:00', morgen: '07:00', ettermiddag: '16:00' }
const handoff = () => ({ ...standardModell('2026-10-02'), fraKlokke: '16:00', til: '2026-12-18' })

describe('byggFritidsturer', () => {
  it('lager en tur ned og en hjem, og dropper det som er før start eller etter slutt', () => {
    const t = byggFritidsturer([{ fra: '2026-10-10', til: '2026-10-11' }], ramme)
    expect(t.map((x) => `${x.dato} ${x.retning}`)).toEqual(['2026-10-10 ned', '2026-10-11 hjem'])
    expect(byggFritidsturer([{ fra: '2026-09-01', til: '2026-09-02' }], ramme)).toEqual([])
    expect(byggFritidsturer([{ fra: '2027-01-10', til: '2027-01-11' }], ramme)).toEqual([])
  })
})

describe('flyplassprisen', () => {
  it('alle forhåndsvalg har en pris', () => {
    expect(PRESETS.every((p) => p.lufthavn > 0)).toBe(true)
  })
  it('egen strekning bruker oppgitt pris, ellers enkeltbillett pluss tillegg', () => {
    expect(fritidGrunnpris({ lufthavn: 250, enkelt: 100 })).toBe(250)
    expect(fritidGrunnpris({ lufthavn: null, enkelt: 100 })).toBe(100 + OSL_TILLEGG)
  })
})

describe('flyplass før Oslo S (fra nord)', () => {
  const reise = { fra: '2026-10-10', til: '2026-10-11' }
  const nord = (m, lufthavn = 200) => ({ ...m, strekninger: [{ ...m.strekninger[0], flyplass: "foer", lufthavn }] })

  it('periodebillett dekker hele veien, uten tillegg', () => {
    const base = beregn(nord(handoff()))
    const r = beregn({ ...nord(handoff()), fritidsreiser: [reise] })
    expect(r.resultat.kostnad).toBe(base.resultat.kostnad)
    expect(r.fritid.forhold).toBe('foer')
    expect(r.fritid.reiser.map((x) => [x.dekning, x.pris])).toEqual([['periode', 0], ['periode', 0]])
  })
  it('uten periodebillett kjøpes hele flyplassbilletten', () => {
    const m = nord(handoff(), 200)
    const r = beregn({ ...m, strekninger: [{ ...m.strekninger[0], perioder: [] }], fritidsreiser: [reise] })
    expect(r.fritid.reiser.map((x) => [x.dekning, x.pris])).toEqual([['enkelt', 200], ['enkelt', 200]])
  })
  it('eksisterende billett gir ingen ekstra kostnad', () => {
    const r = beregn({ ...nord(handoff()), eksisterende: { paa: true, type: 'maaned', til: '2026-10-20', klokke: '07:00' }, fritidsreiser: [reise] })
    expect(r.fritid.reiser.map((x) => [x.dekning, x.pris])).toEqual([['eksisterende', 0], ['eksisterende', 0]])
  })
})

describe('beregn med fritidsreiser', () => {
  const reise = { fra: '2026-10-10', til: '2026-10-11' }
  it('periodebillett dekker strekningen, så bare tillegget kjøpes', () => {
    const base = beregn(handoff())
    const r = beregn({ ...handoff(), fritidsreiser: [reise] })
    expect(r.resultat.kostnad - base.resultat.kostnad).toBe(2 * OSL_TILLEGG)
    expect(r.fritid.reiser.map((x) => x.dekning)).toEqual(['periode', 'periode'])
    expect(r.fritid.estimert).toBe(false)
  })

  it('uten periodebillett kjøpes hele flyplassbilletten', () => {
    const m = handoff()
    const r = beregn({ ...m, strekninger: [{ ...m.strekninger[0], perioder: [] }], fritidsreiser: [reise] })
    expect(r.fritid.reiser.every((t) => t.dekning === 'enkelt' && t.pris === 308)).toBe(true)
  })

  it('eksisterende billett gir bare tillegget', () => {
    const r = beregn({ ...handoff(), eksisterende: { paa: true, type: 'maaned', til: '2026-10-20', klokke: '07:00' }, fritidsreiser: [reise] })
    expect(r.fritid.reiser.map((x) => [x.dekning, x.pris])).toEqual([['eksisterende', OSL_TILLEGG], ['eksisterende', OSL_TILLEGG]])
  })

  it('reiser etter prisøkningen får estimat', () => {
    const r = beregn({ ...handoff(), til: '2027-03-01', fritidsreiser: [{ fra: '2027-02-10', til: '2027-02-11' }] })
    expect(r.fritid.estimert).toBe(true)
  })

  it('reiser utenfor perioden gir ingen fritidsdel', () => {
    const r = beregn({ ...handoff(), fritidsreiser: [{ fra: '2027-03-01', til: '2027-03-02' }] })
    expect(r.fritid).toBeNull()
  })
})

describe('lagret «utenfor» for Oslo S', () => {
  it('regnes som «foer»', () => {
    expect(flyplassForhold({ navn: 'Hamar–Oslo S', flyplass: 'utenfor' })).toBe('foer')
    expect(flyplassForhold({ navn: 'Hamar–Lillestrøm', flyplass: 'utenfor' })).toBe('utenfor')
  })
})
