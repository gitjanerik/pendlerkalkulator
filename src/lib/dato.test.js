import { describe, it, expect } from 'vitest'
import {
  dagNr,
  isoFraDagNr,
  leggTilDager,
  leggTilMaaneder,
  ukedag,
  tidspunkt,
  formaterTidspunkt,
  parseTidspunkt,
  datoerMellom,
  sisteSondag,
} from './dato.js'

describe('dato', () => {
  it('rundturer dagNr', () => {
    expect(isoFraDagNr(dagNr('2026-10-02'))).toBe('2026-10-02')
    expect(dagNr('1970-01-01')).toBe(0)
  })

  it('ukedag: 0 = mandag', () => {
    expect(ukedag('2026-10-02')).toBe(4)
    expect(ukedag('2026-10-04')).toBe(6)
    expect(ukedag('2026-10-05')).toBe(0)
  })

  it('leggTilDager krysser måneds- og årsskifte', () => {
    expect(leggTilDager('2026-12-30', 4)).toBe('2027-01-03')
  })

  it('leggTilMaaneder beholder dagen og kutter til månedens siste dag', () => {
    expect(leggTilMaaneder('2026-10-12', 1)).toBe('2026-11-12')
    expect(leggTilMaaneder('2026-12-15', 1)).toBe('2027-01-15')
    expect(leggTilMaaneder('2026-01-15', -1)).toBe('2025-12-15')
    expect(leggTilMaaneder('2026-01-31', 1)).toBe('2026-02-28')
    expect(leggTilMaaneder('2028-01-31', 1)).toBe('2028-02-29')
    expect(leggTilMaaneder('2026-03-31', -1)).toBe('2026-02-28')
    expect(leggTilMaaneder('2028-02-29', 12)).toBe('2029-02-28')
    expect(leggTilMaaneder('2026-05-15', -12)).toBe('2025-05-15')
  })

  it('formaterer og parser tidspunkt', () => {
    const t = tidspunkt('2026-10-02', '16:05')
    expect(formaterTidspunkt(t)).toBe('2026-10-02T16:05')
    expect(parseTidspunkt('2026-10-02T16:05')).toBe(t)
  })

  it('datoerMellom er inklusiv', () => {
    expect(datoerMellom('2026-12-30', '2027-01-01')).toEqual(['2026-12-30', '2026-12-31', '2027-01-01'])
  })

  it('siste søndag i oktober og mars', () => {
    expect(sisteSondag(2026, 10)).toBe('2026-10-25')
    expect(sisteSondag(2027, 3)).toBe('2027-03-28')
  })
})
