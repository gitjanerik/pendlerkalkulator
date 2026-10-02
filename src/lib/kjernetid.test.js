import { describe, expect, it } from 'vitest'
import { avreiseFraKjernetid } from './kjernetid.js'

describe('avreiseFraKjernetid', () => {
  it('reiser tidsnok til kjernetiden starter og hjem når den slutter', () => {
    expect(avreiseFraKjernetid({ fra: '09:00', til: '15:00' }, 40)).toEqual({ morgen: '08:20', ettermiddag: '15:00' })
  })
  it('runder ned til 5 minutter', () => {
    expect(avreiseFraKjernetid({ fra: '09:00', til: '15:00' }, 33).morgen).toBe('08:25')
  })
  it('tåler manglende reisetid', () => {
    expect(avreiseFraKjernetid({ fra: '09:00', til: '15:00' }, '').morgen).toBe('09:00')
  })
  it('går ikke før midnatt', () => {
    expect(avreiseFraKjernetid({ fra: '00:10', til: '15:00' }, 60).morgen).toBe('00:00')
  })
})
