import { describe, expect, it, vi } from 'vitest'
import { finnStasjon, hentAvganger, klokke, tolkAvganger, velgStasjon } from './entur.js'

const svar = (data, ok = true, status = 200) => vi.fn().mockResolvedValue({ ok, status, json: async () => data })

const trip = (over = {}) => ({
  aimedStartTime: '2026-10-05T07:10:00+02:00',
  expectedStartTime: '2026-10-05T07:13:00+02:00',
  expectedEndTime: '2026-10-05T07:41:00+02:00',
  legs: [{ mode: 'rail', realtime: true, line: { publicCode: 'RE11' }, fromEstimatedCall: { cancellation: false } }],
  ...over,
})

describe('Entur', () => {
  it('velger første jernbanestasjon i stedsøket', () => {
    const j = { features: [
      { properties: { id: 'NSR:StopPlace:1', name: 'Asker skole', category: ['onstreetBus'] } },
      { properties: { id: 'NSR:StopPlace:2', name: 'Asker stasjon', category: ['railStation', 'onstreetBus'] } },
    ] }
    expect(velgStasjon(j)).toEqual({ id: 'NSR:StopPlace:2', navn: 'Asker stasjon' })
    expect(velgStasjon({ features: [] })).toBeNull()
    expect(velgStasjon(null)).toBeNull()
  })

  it('tolker avganger med forsinkelse, linje og bytter', () => {
    const [a] = tolkAvganger({ data: { trip: { tripPatterns: [trip()] } } })
    expect(a).toMatchObject({ forsinkelseMin: 3, linjer: ['RE11'], bytter: 0, innstilt: false, sanntid: true })
  })

  it('teller bytte og ignorerer ikke-tog', () => {
    const t = trip({ legs: [
      { mode: 'rail', line: { publicCode: 'L1' } },
      { mode: 'foot' },
      { mode: 'rail', line: { publicCode: 'R10' }, fromEstimatedCall: { cancellation: true } },
    ] })
    const [a] = tolkAvganger({ data: { trip: { tripPatterns: [t] } } })
    expect(a.linjer).toEqual(['L1', 'R10'])
    expect(a.bytter).toBe(1)
    expect(a.innstilt).toBe(true)
  })

  it('kaster ved GraphQL-feil og gir tom liste uten data', () => {
    expect(() => tolkAvganger({ errors: [{ message: 'Ugyldig sted' }] })).toThrow('Ugyldig sted')
    expect(tolkAvganger({ data: { trip: { tripPatterns: [] } } })).toEqual([])
  })

  it('formaterer klokkeslett i norsk tid', () => {
    expect(klokke('2026-10-05T05:12:00Z')).toBe('07:12')
    expect(klokke('2026-12-05T05:12:00Z')).toBe('06:12')
  })

  it('sender klientnavn og variabler, og kaster ved HTTP-feil', async () => {
    const hent = svar({ data: { trip: { tripPatterns: [trip()] } } })
    const r = await hentAvganger('A', 'B', { hent, n: 3 })
    expect(r).toHaveLength(1)
    const [url, init] = hent.mock.calls[0]
    expect(url).toContain('journey-planner/v3/graphql')
    expect(init.headers['ET-Client-Name']).toBeTruthy()
    expect(JSON.parse(init.body).variables).toEqual({ fra: 'A', til: 'B', n: 3 })
    await expect(hentAvganger('A', 'B', { hent: svar({}, false, 503) })).rejects.toThrow('503')
    expect(await finnStasjon('Asker', svar({ features: [] }))).toBeNull()
  })
})
