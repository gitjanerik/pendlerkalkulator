import { describe, it, expect } from 'vitest'
import { OSL_PRISER, byggFritidsturer, prisFritidsturer } from './fritid.js'
import { beregn, standardModell } from './modell.js'

const ramme = { fra: '2026-10-02', til: '2026-12-18', fraKlokke: '16:00', morgen: '07:00', ettermiddag: '16:00' }
const handoff = () => ({ ...standardModell('2026-10-02'), fraKlokke: '16:00', til: '2026-12-18' })

describe('byggFritidsturer', () => {
  it('lager en tur ned og en hjem, og dropper det som er før start eller etter slutt', () => {
    const t = byggFritidsturer([{ fra: '2026-10-10', til: '2026-10-11' }], ramme)
    expect(t.map((x) => `${x.dato} ${x.retning}`)).toEqual(['2026-10-10 ned', '2026-10-11 hjem'])
    expect(byggFritidsturer([{ fra: '2026-09-01', til: '2026-09-02' }], ramme)).toEqual([])
    expect(byggFritidsturer([{ fra: '2027-01-10', til: '2027-01-11' }], ramme)).toEqual([])
  })
})

describe('prisFritidsturer', () => {
  const turer = [{ dato: '2026-10-10', retning: 'ned', tid: 1 }, { dato: '2027-02-10', retning: 'hjem', tid: 2 }]
  const prisokning = { paa: true, prosent: 4, dato: '02-01' }
  it('bruker stasjonens pris og prisøkning fra 1. februar', () => {
    const r = prisFritidsturer(turer, { id: 'gulskogen' }, '2026-10-02', prisokning)
    expect(r.map((x) => x.pris)).toEqual([308, 320])
    expect(r.map((x) => x.estimert)).toEqual([false, true])
  })
  it('har pris for alle forhåndsvalgte stasjoner', () => {
    expect(Object.keys(OSL_PRISER)).toHaveLength(8)
  })
})

describe('beregn med fritidsreiser', () => {
  it('legger til én billett hjemstasjon–Oslo lufthavn per reise', () => {
    const base = beregn(handoff())
    const r = beregn({ ...handoff(), fritidsreiser: [{ fra: '2026-10-10', til: '2026-10-11' }] })
    expect(r.resultat.kostnad - base.resultat.kostnad).toBe(2 * 308)
    expect(r.fritid.sum).toBe(2 * 308)
    expect(r.fritid.estimert).toBe(false)
  })

  it('reiser etter prisøkningen får estimat', () => {
    const r = beregn({ ...handoff(), til: '2027-03-01', fritidsreiser: [{ fra: '2027-02-10', til: '2027-02-11' }] })
    expect(r.fritid.estimert).toBe(true)
    expect(r.fritid.sum).toBe(2 * 320)
  })

  it('reiser utenfor perioden gir ingen fritidsdel', () => {
    const r = beregn({ ...handoff(), fritidsreiser: [{ fra: '2027-03-01', til: '2027-03-02' }] })
    expect(r.fritid).toBeNull()
    expect(r.resultat.kostnad).toBe(beregn(handoff()).resultat.kostnad)
  })
})
