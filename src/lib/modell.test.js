import { describe, it, expect } from 'vitest'
import { beregn, standardModell, normaliserStrekninger, monsterAnalyse } from './modell.js'
import { PRESETS, strekningFraPreset } from './presets.js'

const handoff = () => ({
  ...standardModell('2026-10-02'),
  fraKlokke: '16:00',
  til: '2026-12-18',
  inkluderAarskort: false,
  sisteFullPris: false,
})

describe('beregn', () => {
  it('reproduserer handoff-eksempelet fra skjematilstand', () => {
    const r = beregn(handoff())
    expect(r.feil).toBeNull()
    expect(r.resultat.kostnad).toBeCloseTo(5027.39, 1)
    expect(r.alternativer.find((a) => a.navn === 'Bare 30-dagersbilletter').differanse).toBeCloseTo(158.19, 1)
  })

  it('meldinger for ugyldig input', () => {
    expect(beregn({ ...handoff(), til: '2026-09-01' }).feil).toMatch(/før startdatoen/)
    expect(beregn({ ...handoff(), fra: '' }).feil).toMatch(/dato/)
    expect(beregn({ ...handoff(), morgen: '7' }).feil).toMatch(/Avgangstidene/)
    expect(beregn({ ...handoff(), til: '2031-01-01' }).feil).toMatch(/høyst/)
    expect(beregn({ ...handoff(), strekninger: [] }).feil).toMatch(/minst én/)
  })

  it('ferie fjerner reisedager', () => {
    const med = beregn({ ...handoff(), ferie: [{ fra: '2026-10-12', til: '2026-10-16' }] })
    const uten = beregn(handoff())
    expect(med.oppsummering.reisedager).toBe(uten.oppsummering.reisedager - 5)
  })

  it('bil-strekning uten bildager gir forklarende feil', () => {
    const m = {
      ...handoff(),
      bilUkedager: [],
      strekninger: [{ id: 'a', navn: 'Asker', bil: true, enkelt: 0, perioder: [{ dager: 7, pris: 662 }] }],
    }
    expect(beregn(m).feil).toMatch(/ikke/)
  })
})

describe('normaliserStrekninger', () => {
  it('dropper tomme perioder og strekninger uten priser', () => {
    const res = normaliserStrekninger([
      { id: '1', navn: ' ', bil: false, ruter: true, enkelt: '156', perioder: [{ dager: 7, pris: '' }, { dager: 30, pris: 100 }] },
      { id: '2', navn: 'Tom', enkelt: '', perioder: [] },
    ])
    expect(res).toEqual([
      { id: '1', navn: 'Uten navn', bil: false, ruter: true, enkelt: 156, lufthavn: null, flyplass: null, tillegg: '', tilEnturId: '', nye: null, perioder: [{ dager: 30, pris: 100, ny: null }] },
    ])
  })
})

describe('jobbdager og rabatt', () => {
  const base = () => ({ ...standardModell('2026-10-05'), til: '2026-12-18', inkluderAarskort: false })

  it('færre jobbdager gir lavere eller lik kostnad', () => {
    const alle = beregn(base()).resultat.kostnad
    const tre = beregn({ ...base(), jobbUkedager: [1, 2, 3] }).resultat.kostnad
    expect(tre).toBeLessThanOrEqual(alle)
  })

  it('full pris på siste billett er standard; av gir forholdsmessig pris', () => {
    const m = { ...base(), fra: '2026-10-12', til: '2026-12-23', fraKlokke: '06:30' }
    expect(m.sisteFullPris).toBe(true)
    const full = beregn(m).resultat
    const andel = beregn({ ...m, sisteFullPris: false }).resultat
    expect(full.kostnad).toBeGreaterThan(andel.kostnad)
    expect(full.billetter.every((b) => b.andelPris === b.pris)).toBe(true)
  })

  it('uten jobbdager gir feilmelding', () => {
    expect(beregn({ ...base(), jobbUkedager: [] }).feil).toMatch(/jobbdag/)
  })

  it('Reis gjør enkeltbilletter billigere og berører ikke periodekort', () => {
    const m = { ...base(), strekninger: [{ id: 'a', navn: 'A', ruter: true, enkelt: 100, perioder: [] }] }
    const uten = beregn(m)
    const med = beregn({ ...m, reis: true })
    expect(med.resultat.kostnad).toBeLessThan(uten.resultat.kostnad)
    expect(med.resultat.reis.maksProsent).toBe(40)
    expect(uten.resultat.reis).toBeNull()
    const pk = { ...base(), reis: true }
    expect(beregn(pk).resultat.kostnad).toBe(beregn(base()).resultat.kostnad)
  })

  it('mønsteranalyse gir fem punkter', () => {
    const a = monsterAnalyse(base())
    expect(a.map((x) => x.antall)).toEqual([1, 2, 3, 4, 5])
    expect(a[4].kostnad).toBe(beregn(base()).resultat.kostnad)
  })
})

describe('eksisterende periodebillett', () => {
  const base = { ...standardModell('2026-10-05'), til: '2026-12-31' }

  it('starter beregningen når billetten utløper', () => {
    const uten = beregn(base)
    const med = beregn({ ...base, eksisterende: { paa: true, type: 'maaned', til: '2026-11-02', klokke: '07:00' } })
    expect(med.feil).toBeNull()
    expect(med.resultat.kostnad).toBeLessThan(uten.resultat.kostnad)
    expect(med.oppsummering.turer).toBeLessThan(uten.oppsummering.turer)
  })

  it('sier fra når billetten dekker hele perioden', () => {
    const r = beregn({ ...base, eksisterende: { paa: true, type: 'aar', til: '2027-06-01', klokke: '07:00' } })
    expect(r.feil).toMatch(/dekker hele perioden/)
  })

  it('ignoreres når den er av eller ufullstendig', () => {
    const a = beregn(base).resultat.kostnad
    expect(beregn({ ...base, eksisterende: { paa: false, til: '2026-11-02', klokke: '07:00' } }).resultat.kostnad).toBe(a)
    expect(beregn({ ...base, eksisterende: { paa: true, til: '', klokke: '07:00' } }).resultat.kostnad).toBe(a)
  })
})

describe('tidshorisont uten kunstig slutt', () => {
  const aar = (fra, til) => ({ ...standardModell(fra), til, inkluderAarskort: false, sisteFullPris: false })

  it('et år fra 5. oktober er bare månedskort, uten 7-dagers og enkeltbilletter', () => {
    const r = beregn(aar('2026-10-05', '2027-10-04'))
    expect(r.resultat.billetter.map((b) => b.dager)).toEqual(Array(12).fill(30))
    expect(r.resultat.enkeltReiser).toHaveLength(0)
  })

  it('siste billett tilpasses ikke sluttdatoen', () => {
    for (const til of ['2027-03-10', '2027-06-21', '2028-10-04']) {
      const r = beregn(aar('2026-10-05', til))
      expect(r.resultat.billetter.at(-1).dager).toBe(30)
    }
  })

  it('årskort bruker hele prisen i et år, ikke et tilfeldig utsnitt', () => {
    const r = beregn({ ...standardModell('2026-10-05'), inkluderAarskort: true, til: '2027-10-04' })
    expect(r.resultat.billetter.map((b) => b.dager)).toEqual([365])
    expect(r.resultat.kostnad).toBeCloseTo(20380 * 1.0, -3)
  })
})

describe('årskort før mot etter prisøkning', () => {
  it('gir forskjellen på årskortet rett før og etter 1. februar', () => {
    const m = { ...standardModell('2026-10-04'), prisDato: '2026-10-02', fra: '2026-11-01', til: '2027-12-31', fraKlokke: '00:00' }
    const r = beregn(m).aarskort.foerEtter
    expect(r.foerDato).toBe('2027-01-31')
    expect(r.foer).toBe(20380)
    expect(r.differanse).toBe(815)
  })

  it('er null uten prisøkning', () => {
    const m = { ...standardModell('2026-10-04'), prisDato: '2026-10-02', fra: '2026-11-01', til: '2027-12-31', fraKlokke: '00:00', prisokning: { paa: false, prosent: 4, dato: '02-01' } }
    expect(beregn(m).aarskort.foerEtter).toBeNull()
  })
})

describe('nye priser fra dato', () => {
  const med = (nyePriser, nye, ekstra = {}) => {
    const m = { ...standardModell('2026-10-04'), prisDato: '2026-10-02', fra: '2026-11-01', til: '2027-12-31', fraKlokke: '00:00', sisteFullPris: false, ...ekstra }
    m.strekninger = [{ ...m.strekninger[0], nye }]
    return { ...m, nyePriser }
  }
  const aarskortNy = { enkelt: '', lufthavn: '', perioder: [{ dager: 365, pris: 21500 }] }

  it('årskortforskjellen bruker oppgitt ny pris og er bekreftet', () => {
    const r = beregn(med({ paa: true, dato: '2027-01-15' }, aarskortNy)).aarskort.foerEtter
    expect(r).toMatchObject({ foer: 20380, etter: 21500, differanse: 1120, etterDato: '2027-01-15', foerDato: '2027-01-14', bekreftet: true })
  })

  it('uten bryter gjelder prosentanslaget som før', () => {
    const r = beregn(med({ paa: false, dato: '2027-01-15' }, aarskortNy)).aarskort.foerEtter
    expect(r).toMatchObject({ differanse: 815, bekreftet: false })
  })

  it('en høyere ny pris gjør årskortet dyrere totalt enn uten ny pris', () => {
    const uten = beregn({ ...med({ paa: false, dato: '' }, null), prisokning: { paa: false, prosent: 4, dato: '02-01' }, inkluderAarskort: true })
    const ny = beregn({ ...med({ paa: true, dato: '2027-01-15' }, { ...aarskortNy, perioder: [{ dager: 365, pris: 30000 }, { dager: 30, pris: 5000 }] }), prisokning: { paa: false, prosent: 4, dato: '02-01' }, inkluderAarskort: true })
    expect(ny.resultat.kostnad).toBeGreaterThan(uten.resultat.kostnad)
  })

  it('felt uten ny pris regnes som uendret', () => {
    const m = med({ paa: true, dato: '2027-01-15' }, { enkelt: '', lufthavn: '', perioder: [] })
    const grunn = { ...m, prisokning: { paa: false, prosent: 4, dato: '02-01' } }
    expect(beregn(grunn).resultat.kostnad).toBe(beregn({ ...grunn, nyePriser: { paa: false, dato: '' } }).resultat.kostnad)
  })

  it('normaliserer nye priser og dropper tomme', () => {
    const [s] = normaliserStrekninger([{ ...strekningFraPreset(PRESETS[0], PRESETS[0].id), nye: { enkelt: '200', perioder: [{ dager: 30, pris: '' }, { dager: 7, pris: '700' }] } }])
    expect(s.nye).toMatchObject({ enkelt: 200, perioder: [{ dager: 7, pris: 700 }] })
    expect(s.perioder.find((p) => p.dager === 7).ny).toBe(700)
    expect(normaliserStrekninger([{ ...strekningFraPreset(PRESETS[0], PRESETS[0].id), nye: { enkelt: '', perioder: [] } }])[0].nye).toBeNull()
  })
})
