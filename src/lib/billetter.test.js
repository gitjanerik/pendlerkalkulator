import { describe, it, expect } from 'vitest'
import { isoUke, utnyttelse } from './billetter.js'

describe('isoUke', () => {
  it('følger ISO 8601 over årsskiftet', () => {
    expect(isoUke('2026-10-02')).toBe(40)
    expect(isoUke('2026-01-01')).toBe(1)
    expect(isoUke('2027-01-01')).toBe(53)
    expect(isoUke('2024-12-30')).toBe(1)
  })
})

describe('utnyttelse', () => {
  const ramme = { morgen: '07:00', ettermiddag: '16:00', retninger: 'begge' }
  const uke = { aktivering: '2026-10-05T07:00', utloper: '2026-10-12T07:00', antallTurer: 10 }

  it('full arbeidsuke gir 100 %', () => {
    expect(utnyttelse(uke, ramme)).toBe(10 / 11)
    expect(utnyttelse({ ...uke, utloper: '2026-10-11T23:59', antallTurer: 10 }, ramme)).toBe(1)
  })

  it('hjemmekontor og ferie gir lavere andel', () => {
    expect(utnyttelse({ ...uke, utloper: '2026-10-11T23:59', antallTurer: 6 }, ramme)).toBe(0.6)
  })

  it('én retning halverer antall mulige reiser', () => {
    expect(utnyttelse({ ...uke, utloper: '2026-10-11T23:59', antallTurer: 5 }, { ...ramme, retninger: 'morgen' })).toBe(1)
  })
})
