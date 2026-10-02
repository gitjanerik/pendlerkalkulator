import { describe, it, expect } from 'vitest'
import { tilEtterMaaneder } from './periode.js'

describe('tilEtterMaaneder', () => {
  it('siste dag i perioden er dagen før samme dato N måneder senere', () => {
    expect(tilEtterMaaneder('2026-10-02', 3)).toBe('2027-01-01')
    expect(tilEtterMaaneder('2026-10-01', 1)).toBe('2026-10-31')
    expect(tilEtterMaaneder('2026-10-02', 12)).toBe('2027-10-01')
  })
  it('klemmer til månedens siste dag når datoen ikke finnes', () => {
    expect(tilEtterMaaneder('2026-11-30', 3)).toBe('2027-02-28')
  })
})
