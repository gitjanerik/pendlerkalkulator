import { describe, it, expect } from 'vitest'
import { antallPrisokninger, prisPaaDato, aarskortFoerEtter, prisMedNy, erEstimert } from './priser.js'

const paa = { paa: true, prosent: 4, dato: '02-01' }

describe('prisøkning', () => {
  it('ingen økning når den er av', () => {
    expect(prisPaaDato(2038, '2026-10-02', '2028-03-01', { ...paa, paa: false })).toBe(2038)
  })

  it('tre økninger over to år og litt', () => {
    expect(antallPrisokninger('2026-10-02', '2026-12-31', paa)).toBe(0)
    expect(antallPrisokninger('2026-10-02', '2027-02-01', paa)).toBe(1)
    expect(antallPrisokninger('2026-10-02', '2029-02-01', paa)).toBe(3)
  })

  it('priser aktivert fra og med 1. februar får ny pris', () => {
    expect(prisPaaDato(2038, '2026-10-02', '2027-01-31', paa)).toBe(2038)
    expect(prisPaaDato(2038, '2026-10-02', '2027-02-01', paa)).toBe(2120)
  })

  it('prisliste datert på selve økningsdagen får ikke en ekstra økning', () => {
    expect(antallPrisokninger('2027-02-01', '2027-06-01', paa)).toBe(0)
  })

  it('årskort før mot etter økningen', () => {
    const r = aarskortFoerEtter(20380, '2026-10-02', '2027-01-04', paa)
    expect(r.foerDato).toBe('2027-01-31')
    expect(r.foer).toBe(20380)
    expect(r.etterDato).toBe('2027-02-01')
    expect(r.etter).toBe(21195)
    expect(r.differanse).toBe(815)
  })
})

describe('nye priser fra dato', () => {
  const info = { prisDato: '2026-10-01', nyDato: '2027-01-15', prisokning: { paa: true, prosent: 4, dato: '02-01' } }
  it('gammel pris før datoen, uten økning', () => {
    expect(prisMedNy(1000, 1200, '2027-01-14', info)).toBe(1000)
  })
  it('ny pris fra datoen, deretter prosent fra neste 1. februar', () => {
    expect(prisMedNy(1000, 1200, '2027-01-15', info)).toBe(1200)
    expect(prisMedNy(1000, 1200, '2027-02-01', info)).toBe(1248)
  })
  it('uendret pris når ny pris mangler', () => {
    expect(prisMedNy(1000, null, '2027-01-20', info)).toBe(1000)
  })
  it('uten nyDato brukes prosentanslaget', () => {
    expect(prisMedNy(1000, 1200, '2027-03-01', { ...info, nyDato: null })).toBe(1040)
  })
  it('estimert først når prosent er regnet inn', () => {
    expect(erEstimert('2027-01-20', info)).toBe(false)
    expect(erEstimert('2027-02-01', info)).toBe(true)
    expect(erEstimert('2027-01-01', info)).toBe(false)
  })
})
