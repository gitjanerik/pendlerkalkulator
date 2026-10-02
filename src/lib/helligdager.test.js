import { describe, it, expect } from 'vitest'
import { paaskedag, norskeHelligdager, paaskeukeMandagOnsdag } from './helligdager.js'

describe('påske', () => {
  it.each([
    [2024, '2024-03-31'],
    [2025, '2025-04-20'],
    [2026, '2026-04-05'],
    [2027, '2027-03-28'],
  ])('påskedag %i', (aar, forventet) => {
    expect(paaskedag(aar)).toBe(forventet)
  })

  it('mandag–onsdag før palmesøndag-uka er dagene etter palmesøndag', () => {
    expect(paaskeukeMandagOnsdag(2026)).toEqual(['2026-03-30', '2026-03-31', '2026-04-01'])
  })
})

describe('norske helligdager 2026', () => {
  const h = norskeHelligdager(2026)

  it('har bevegelige dager fra påske', () => {
    expect(h['2026-04-02']).toBe('Skjærtorsdag')
    expect(h['2026-04-03']).toBe('Langfredag')
    expect(h['2026-04-06']).toBe('2. påskedag')
    expect(h['2026-05-14']).toBe('Kristi himmelfartsdag')
    expect(h['2026-05-24']).toBe('1. pinsedag')
    expect(h['2026-05-25']).toBe('2. pinsedag')
  })

  it('har faste dager, men ikke julaften', () => {
    expect(h['2026-05-17']).toBe('Grunnlovsdag')
    expect(h['2026-12-25']).toBe('1. juledag')
    expect(h['2026-12-24']).toBeUndefined()
    expect(Object.keys(h)).toHaveLength(13)
  })
})
