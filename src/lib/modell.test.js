import { describe, it, expect } from 'vitest'
import { beregn, standardModell, normaliserStrekninger, monsterAnalyse } from './modell.js'

const handoff = () => ({
  ...standardModell('2026-10-02'),
  fraKlokke: '16:00',
  til: '2026-12-18',
  inkluderAarskort: false,
})

describe('beregn', () => {
  it('reproduserer handoff-eksempelet fra skjematilstand', () => {
    const r = beregn(handoff())
    expect(r.feil).toBeNull()
    expect(r.resultat.kostnad).toBe(5730)
    expect(r.alternativer.find((a) => a.navn === 'Bare 30-dagersbilletter').differanse).toBe(384)
    expect(r.varsler).toHaveLength(1)
  })

  it('meldinger for ugyldig input', () => {
    expect(beregn({ ...handoff(), til: '2026-09-01' }).feil).toMatch(/før startdatoen/)
    expect(beregn({ ...handoff(), fra: '' }).feil).toMatch(/dato/)
    expect(beregn({ ...handoff(), morgen: '7' }).feil).toMatch(/Avgangstidene/)
    expect(beregn({ ...handoff(), til: '2030-01-01' }).feil).toMatch(/høyst/)
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
      { id: '1', navn: ' ', bil: false, enkelt: '156', perioder: [{ dager: 7, pris: '' }, { dager: 30, pris: 100 }] },
      { id: '2', navn: 'Tom', enkelt: '', perioder: [] },
    ])
    expect(res).toEqual([
      { id: '1', navn: 'Uten navn', bil: false, enkelt: 156, perioder: [{ dager: 30, pris: 100 }] },
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

  it('uten jobbdager gir feilmelding', () => {
    expect(beregn({ ...base(), jobbUkedager: [] }).feil).toMatch(/jobbdag/)
  })

  it('Reis-rabatt gjelder bare enkeltbilletter', () => {
    const [s] = normaliserStrekninger([{ id: 'a', navn: 'A', enkelt: 100, reisRabattProsent: 20, perioder: [{ dager: 7, pris: 500 }] }])
    expect(s.enkelt).toBe(80)
    expect(s.perioder[0].pris).toBe(500)
  })

  it('mønsteranalyse gir fem punkter', () => {
    const a = monsterAnalyse(base())
    expect(a.map((x) => x.antall)).toEqual([1, 2, 3, 4, 5])
    expect(a[4].kostnad).toBe(beregn(base()).resultat.kostnad)
  })
})
