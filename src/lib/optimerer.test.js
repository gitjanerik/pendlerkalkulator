import { describe, it, expect } from 'vitest'
import { byggKalender, reisedager } from './kalender.js'
import { byggTurer } from './turer.js'
import { tidspunkt, leggTilDager } from './dato.js'
import { optimaliser, sammenlignAlternativer, aarskortAnalyse } from './optimerer.js'
import { sommertidVarsler } from './varsler.js'

const gulskogen = {
  id: 'gulskogen',
  navn: 'Gulskogen–Oslo S',
  bil: false,
  enkelt: 156,
  perioder: [
    { dager: 7, pris: 827 },
    { dager: 30, pris: 2038 },
    { dager: 365, pris: 20380 },
  ],
}

const asker = {
  id: 'asker',
  navn: 'Asker–Oslo S',
  bil: true,
  enkelt: 68,
  perioder: [{ dager: 7, pris: 662 }],
}

const handoffTurer = (opts = {}) =>
  byggTurer(reisedager(byggKalender({ fra: '2026-10-02', til: '2026-12-18' })), {
    fraTidspunkt: tidspunkt('2026-10-02', '16:00'),
    ...opts,
  })

describe('optimaliser — høst 2026 fra handoff', () => {
  const turer = handoffTurer()
  const res = optimaliser(turer, [gulskogen], { inkluderAarskort: false })

  it('to ukeskort og to månedskort koster 5 730 kr', () => {
    expect(res.kostnad).toBe(5730)
    expect(res.billetter.map((b) => b.dager)).toEqual([7, 7, 30, 30])
    expect(res.udekteDager).toEqual([])
  })

  it('aktivering og utløp følger fornyelse ved neste avreise', () => {
    expect(res.billetter.map((b) => [b.aktivering, b.utloper])).toEqual([
      ['2026-10-02T16:00', '2026-10-09T16:00'],
      ['2026-10-12T07:00', '2026-10-19T07:00'],
      ['2026-10-19T16:00', '2026-11-18T16:00'],
      ['2026-11-19T07:00', '2026-12-19T07:00'],
    ])
  })

  it('markerer billetter der man må være på toget før utløp', () => {
    expect(res.billetter.map((b) => b.passPaa)).toEqual([true, true, true, false])
    expect(res.billetter[1].marginMin).toBe(0)
  })

  it('tre månedskort koster 6 114 kr, altså 384 kr mer', () => {
    const { alternativer } = sammenlignAlternativer(turer, [gulskogen], { inkluderAarskort: false })
    const tre = alternativer.find((a) => a.navn === 'Bare 30-dagersbilletter')
    expect(tre.resultat.kostnad).toBe(6114)
    expect(tre.differanse).toBe(384)
  })

  it('bare enkeltbilletter er dyrest', () => {
    const { alternativer } = sammenlignAlternativer(turer, [gulskogen], { inkluderAarskort: false })
    const enkelt = alternativer.find((a) => a.navn === 'Bare enkeltbilletter')
    expect(enkelt.resultat.kostnad).toBe(turer.length * 156)
  })
})

describe('optimaliser — egenskaper', () => {
  it('ingen turer koster ingenting', () => {
    expect(optimaliser([], [gulskogen])).toMatchObject({ mulig: true, kostnad: 0, billetter: [] })
  })

  it('en enkelt tur dekkes av enkeltbillett, ikke ukeskort', () => {
    const turer = byggTurer([{ dato: '2026-10-02' }], { retninger: 'morgen' })
    const res = optimaliser(turer, [gulskogen])
    expect(res.kostnad).toBe(156)
    expect(res.udekteDager).toEqual([{ dato: '2026-10-02', antallTurer: 1, kostnad: 156 }])
  })

  it('årskort velges når det lønner seg og markeres som bindende', () => {
    const turer = byggTurer(reisedager(byggKalender({ fra: '2027-01-04', til: '2027-12-31' })))
    const res = optimaliser(turer, [gulskogen])
    expect(res.billetter[0]).toMatchObject({ dager: 365, bindende: true })
    const analyse = aarskortAnalyse(turer, [gulskogen])
    expect(analyse.lonnerSeg).toBe(true)
    expect(analyse.besparelse).toBeGreaterThan(0)
  })

  it('prisøkning 1. februar gjør årskort kjøpt i januar billigere enn månedskort etterpå', () => {
    const prisokning = { paa: true, prosent: 4, dato: '02-01' }
    const turer = byggTurer(reisedager(byggKalender({ fra: '2027-01-04', til: '2027-12-31' })))
    const res = optimaliser(turer, [gulskogen], { prisDato: '2026-10-02', prisokning })
    expect(res.billetter[0]).toMatchObject({ dager: 365, pris: 20380 })
  })

  it('Asker-kort brukes bare på bil-dager og brytes ellers', () => {
    const dager = reisedager(byggKalender({ fra: '2026-10-05', til: '2026-10-09' }))
    const turer = byggTurer(dager, { bilDager: 'alle' })
    const res = optimaliser(turer, [asker], { tillatEnkelt: false })
    expect(res.billetter).toHaveLength(1)

    const utenBil = optimaliser(byggTurer(dager), [asker], { tillatEnkelt: false })
    expect(utenBil.mulig).toBe(false)
  })

  it('billigste enkeltbillett velges blant tillatte strekninger', () => {
    const turer = byggTurer([{ dato: '2026-10-02' }], { retninger: 'morgen', bilDager: 'alle' })
    expect(optimaliser(turer, [gulskogen, asker]).kostnad).toBe(68)
  })
})

describe('sommertidVarsler', () => {
  it('varsler om billett som spenner over overgangen til vintertid', () => {
    const turer = handoffTurer()
    const res = optimaliser(turer, [gulskogen], { inkluderAarskort: false })
    const varsler = sommertidVarsler(res.billetter)
    expect(varsler.map((v) => [v.dato, v.billett.dager])).toEqual([['2026-10-25', 30]])
  })

  it('hopper over årskort', () => {
    const b = { dager: 365, aktivering: '2026-10-01T07:00', utloper: '2027-10-01T07:00' }
    expect(sommertidVarsler([b])).toEqual([])
  })
})

describe('Reis', () => {
  const dager = Array.from({ length: 40 }, (_, i) => ({ dato: leggTilDager('2026-10-05', i) }))
  const turer = byggTurer(dager, { retninger: 'morgen' })
  const strekninger = [{ id: 'a', navn: 'A', ruter: true, enkelt: 100, perioder: [] }]

  it('gir ingen Reis-rabatt utenfor Ruters soner', () => {
    const utenfor = [{ id: 'b', navn: 'B', enkelt: 100, perioder: [] }]
    const med = optimaliser(turer, utenfor, { reis: true })
    expect(med.kostnad).toBe(4000)
    expect(med.reis).toBeNull()
  })

  it('rabatterer enkeltbilletter med glidende 30-dagersvindu', () => {
    const uten = optimaliser(turer, strekninger)
    const med = optimaliser(turer, strekninger, { reis: true })
    expect(uten.kostnad).toBe(4000)
    expect(med.kostnad).toBeLessThan(4000)
    expect(med.reis.besparelse).toBe(4000 - med.kostnad)
    expect(med.reis.enkeltreiser).toBe(40)
  })

  it('velger periodekort når det blir billigere enn rabattert enkelt', () => {
    const s = [{ id: 'a', navn: 'A', ruter: true, enkelt: 100, perioder: [{ dager: 30, pris: 900 }] }]
    const med = optimaliser(turer, s, { reis: true })
    expect(med.billetter.length).toBeGreaterThan(0)
    expect(med.kostnad).toBeLessThanOrEqual(optimaliser(turer, s).kostnad)
  })
})
