import { describe, it, expect } from 'vitest'
import { kr, norskDato, norskTidspunkt, dagerTekst, flertall } from './format.js'

describe('format', () => {
  it('beløp med hardt mellomrom som tusenskille', () => {
    expect(kr(5730)).toBe('5 730 kr')
    expect(kr(156)).toBe('156 kr')
    expect(kr(20380)).toBe('20 380 kr')
  })

  it('datoer med ukedag', () => {
    expect(norskDato('2026-10-12')).toBe('man 12. okt')
    expect(norskDato('2026-12-24', true)).toBe('tor 24. des 2026')
  })

  it('tidspunkt med klokkeslett', () => {
    expect(norskTidspunkt('2026-10-02T16:00')).toBe('fre 2. okt kl. 16:00')
  })
})

describe('dagerTekst', () => {
  it('merker årskort', () => {
    expect(dagerTekst(30)).toBe('30 dager')
    expect(dagerTekst(365)).toBe('365 dager (årskort)')
  })
})

describe('flertall', () => {
  it('bruker entall for 1 og flertall ellers', () => {
    expect(flertall(1, 'periodebillett', 'periodebilletter')).toBe('1 periodebillett')
    expect(flertall(0, 'dag', 'dager')).toBe('0 dager')
    expect(flertall(3, 'dag', 'dager')).toBe('3 dager')
  })
})
