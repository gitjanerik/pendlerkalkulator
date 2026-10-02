import { describe, it, expect } from 'vitest'
import { PRESETS, strekningFraPreset } from './presets.js'
import { normaliserStrekninger } from './modell.js'

describe('presets', () => {
  it('unike id-er og stigende priser per varighet', () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length)
    for (const p of PRESETS) {
      const priser = p.perioder.map(([, pris]) => pris)
      expect(priser).toEqual([...priser].sort((a, b) => a - b))
    }
  })

  it('gir gyldig strekning også uten enkeltpris', () => {
    const s = strekningFraPreset({ ...PRESETS.find((p) => p.id === 'lier'), enkelt: null }, 'x')
    expect(s.enkelt).toBe('')
    expect(normaliserStrekninger([s])[0]).toMatchObject({ enkelt: Infinity })
    expect(normaliserStrekninger([s])[0].perioder).toHaveLength(3)
  })
})
