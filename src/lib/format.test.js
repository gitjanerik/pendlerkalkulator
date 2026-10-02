import { describe, it, expect } from 'vitest'
import { kr, norskDato, norskTidspunkt } from './format.js'

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
