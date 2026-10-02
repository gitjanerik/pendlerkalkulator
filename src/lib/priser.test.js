import { describe, it, expect } from 'vitest'
import { antallPrisokninger, prisPaaDato, aarskortFoerEtter } from './priser.js'

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
