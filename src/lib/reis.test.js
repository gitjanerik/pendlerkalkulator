import { describe, expect, it } from 'vitest'
import { anvendReis, reisRabattProsent } from './reis.js'
import { MIN_DOEGN } from './dato.js'

const reiser = (antall, avstandDager = 0, pris = 100) =>
  Array.from({ length: antall }, (_, i) => ({ tid: i * avstandDager * MIN_DOEGN + i, pris }))

describe('Reis-trinn', () => {
  it.each([
    [1, 0], [4, 0], [5, 5], [9, 5], [10, 10], [14, 10], [15, 15], [19, 15],
    [20, 20], [24, 20], [25, 25], [29, 25], [30, 30], [34, 30], [35, 35], [39, 35], [40, 40], [80, 40],
  ])('%i reiser gir %i %%', (antall, prosent) => {
    expect(reisRabattProsent(antall)).toBe(prosent)
  })
})

describe('anvendReis', () => {
  it('første rabatt kommer på reise nummer 5', () => {
    const r = anvendReis(reiser(6))
    expect(r.map((x) => x.prosent)).toEqual([0, 0, 0, 0, 5, 5])
    expect(r[4].netto).toBe(95)
  })

  it('reiser eldre enn 30 dager teller ikke', () => {
    // Én reise annenhver dag: i vinduet ligger høyst 15 reiser.
    const r = anvendReis(reiser(60, 2))
    expect(Math.max(...r.map((x) => x.antall))).toBe(15)
    expect(r.at(-1).prosent).toBe(15)
  })

  it('vinduet er 30 døgn: reisen nøyaktig 30 døgn tilbake faller ut', () => {
    const r = anvendReis([
      { tid: 0, pris: 100 },
      { tid: 30 * MIN_DOEGN - 1, pris: 100 },
      { tid: 30 * MIN_DOEGN, pris: 100 },
    ])
    expect(r.map((x) => x.antall)).toEqual([1, 2, 2])
  })

  it('sorterer reisene selv og tar imot egne regler', () => {
    const r = anvendReis([{ tid: 5, pris: 100 }, { tid: 1, pris: 100 }], { trinn: [[2, 50]] })
    expect(r.map((x) => x.netto)).toEqual([100, 50])
  })

  it('tom liste gir tom liste', () => {
    expect(anvendReis([])).toEqual([])
  })
})
