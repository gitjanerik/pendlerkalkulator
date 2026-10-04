import { describe, expect, it, vi } from 'vitest'
import { flyplassBakOsloS, flyplassForhold, passererOsloS, sokStasjoner, stasjonsForslag, finnStasjon, foreslaaAvganger, hentAvganger, klokke, nesteArbeidsdag, osloTid, tolkAvganger, velgForslag, velgStasjon } from './entur.js'

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

  it('neste arbeidsdag hopper over helgen', () => {
    expect(nesteArbeidsdag('2026-10-02')).toBe('2026-10-05')
    expect(nesteArbeidsdag('2026-10-04')).toBe('2026-10-05')
    expect(nesteArbeidsdag('2026-10-05')).toBe('2026-10-06')
  })

  it('oslotid får sommer- og vintertid', () => {
    expect(osloTid('2026-10-05', '08:55')).toBe('2026-10-05T08:55:00+02:00')
    expect(osloTid('2026-12-07', '08:55')).toBe('2026-12-07T08:55:00+01:00')
  })

  it('velger siste tog som rekker fram, og første tog etter grensen', () => {
    const a = (start, slutt, innstilt = false) => ({ start, slutt, innstilt })
    const liste = [
      a('2026-10-05T07:10:00+02:00', '2026-10-05T07:40:00+02:00'),
      a('2026-10-05T08:10:00+02:00', '2026-10-05T08:40:00+02:00'),
      a('2026-10-05T08:30:00+02:00', '2026-10-05T09:05:00+02:00'),
    ]
    expect(velgForslag(liste, { ankomst: true, grense: '2026-10-05T08:55:00+02:00' })).toBe('08:10')
    const hjem = [
      a('2026-10-05T14:50:00+02:00', '2026-10-05T15:20:00+02:00'),
      a('2026-10-05T15:05:00+02:00', '2026-10-05T15:35:00+02:00', true),
      a('2026-10-05T15:11:00+02:00', '2026-10-05T15:41:00+02:00'),
    ]
    expect(velgForslag(hjem, { ankomst: false, grense: '2026-10-05T15:00:00+02:00' })).toBe('15:11')
    expect(velgForslag([], { ankomst: false, grense: '2026-10-05T15:00:00+02:00' })).toBeNull()
  })

  const tur = (start, slutt) => ({ aimedStartTime: start, expectedStartTime: start, expectedEndTime: slutt, legs: [{ mode: 'rail', line: { publicCode: 'L1' } }] })
  const planSvar = (data) => ({ ok: true, json: async () => ({ data: { trip: { tripPatterns: data } } }) })

  it('foreslår første tog fra ønsket tid i begge retninger', async () => {
    const hent = vi.fn(async (_u, init) => {
      const { variables } = JSON.parse(init.body)
      return planSvar(
        variables.fra === 'A'
          ? [tur('2026-10-05T06:42:00+02:00', '2026-10-05T07:20:00+02:00'), tur('2026-10-05T07:12:00+02:00', '2026-10-05T07:50:00+02:00')]
          : [tur('2026-10-05T15:42:00+02:00', '2026-10-05T16:20:00+02:00'), tur('2026-10-05T16:12:00+02:00', '2026-10-05T16:50:00+02:00')],
      )
    })
    expect(await foreslaaAvganger('A', 'O', '2026-10-02', { morgen: '07:00', ettermiddag: '16:00', hent })).toEqual({ morgen: '07:12', ettermiddag: '16:12' })
    const kall = hent.mock.calls.map(([, i]) => JSON.parse(i.body).variables)
    expect(kall.map((v) => v.tid)).toEqual(['2026-10-05T07:00:00+02:00', '2026-10-05T16:00:00+02:00'])
    expect(kall.every((v) => v.ankomst === false)).toBe(true)
  })

  it('gir null for retningen som ikke har tog', async () => {
    const hent = vi.fn(async (_u, init) =>
      planSvar(JSON.parse(init.body).variables.fra === 'A' ? [] : [tur('2026-10-05T16:12:00+02:00', '2026-10-05T16:50:00+02:00')]),
    )
    expect(await foreslaaAvganger('A', 'O', '2026-10-02', { hent })).toEqual({ morgen: null, ettermiddag: '16:12' })
  })
})

describe('stasjonsForslag', () => {
  const f = (id, navn, category, extra = {}) => ({ properties: { id, name: navn, category, ...extra } })
  const j = { features: [f('A', 'Lillestrøm stasjon', ['railStation'], { locality: 'Lillestrøm' }), f('B', 'Lillestrøm bussterminal', ['busStation']), f('A', 'Lillestrøm stasjon', ['railStation']), f('C', 'Lillehammer stasjon', 'railStation', { county: 'Innlandet' })] }
  it('beholder bare jernbanestasjoner, uten duplikater, med sted', () => {
    expect(stasjonsForslag(j)).toEqual([
      { id: 'A', navn: 'Lillestrøm stasjon', sted: 'Lillestrøm' },
      { id: 'C', navn: 'Lillehammer stasjon', sted: 'Innlandet' },
    ])
    expect(stasjonsForslag(null)).toEqual([])
  })
  it('sokStasjoner henter fra stedsøket', async () => {
    const hent = async (url) => ({ ok: true, json: async () => (url.includes('text=Lille') ? j : { features: [] }) })
    expect((await sokStasjoner('Lille', hent)).length).toBe(2)
  })
})

describe('passererOsloS', () => {
  const sted = (name, id) => ({ name, quay: { stopPlace: { id } } })
  const forslag = (...legs) => ({ data: { trip: { tripPatterns: legs.map((l) => ({ legs: l })) } } })
  const ben = (fra, til, mellom = []) => ({ fromPlace: sted(fra, 'x'), toPlace: sted(til, 'y'), intermediateQuays: mellom.map((n) => ({ name: n, stopPlace: { id: n } })) })

  it('sørfra går reisen via Oslo S', () => {
    expect(passererOsloS(forslag([ben('Drammen', 'Oslo lufthavn', ['Asker', 'Oslo S', 'Lillestrøm'])]), 'NSR:oslo')).toBe(true)
    expect(passererOsloS(forslag([ben('Drammen', 'Oslo S'), ben('Oslo S', 'Oslo lufthavn')]))).toBe(true)
  })
  it('nordfra går reisen uten Oslo S', () => {
    expect(passererOsloS(forslag([ben('Hamar', 'Oslo lufthavn', ['Stange', 'Eidsvoll'])]), 'NSR:oslo')).toBe(false)
  })
  it('kjenner Oslo S på id også', () => {
    expect(passererOsloS(forslag([ben('A', 'B', ['Oslo sentralstasjon'])]), 'Oslo sentralstasjon')).toBe(true)
  })
  it('uten reiser vet vi ikke', () => {
    expect(passererOsloS({ data: { trip: { tripPatterns: [] } } })).toBeNull()
    expect(passererOsloS(null)).toBeNull()
  })
  it('flyplassBakOsloS slår opp stedene og leser reisen', async () => {
    const geo = (id, navn) => ({ features: [{ properties: { id, name: navn, category: ['railStation'] } }] })
    const hent = vi.fn(async (url, init) => ({
      ok: true,
      json: async () => {
        if (init?.method === 'POST') return forslag([ben('Hamar', 'Oslo lufthavn', ['Eidsvoll'])])
        return url.includes('text=Oslo+S') ? geo('NSR:oslo', 'Oslo S') : geo('NSR:osl', 'Oslo lufthavn stasjon')
      },
    }))
    expect(await flyplassBakOsloS('NSR:hamar', { hent })).toBe(false)
  })

  describe('flyplassForhold for fritt valgt jobbsted', () => {
    const geo = (id, navn) => ({ features: [{ properties: { id, name: navn, category: ['railStation'] } }] })
    const lag = (tilFlyplass, tilJobb) => vi.fn(async (url, init) => ({
      ok: true,
      json: async () => {
        if (init?.method === 'POST') return JSON.parse(init.body).variables.til === 'NSR:osl' ? tilFlyplass : tilJobb
        return geo('NSR:osl', 'Oslo lufthavn stasjon')
      },
    }))
    const maal = { id: 'NSR:lillestrom', navn: 'Lillestrøm' }
    it('jobbstedet på veien til flyplassen er «bak»', async () => {
      const hent = lag(forslag([ben('Drammen', 'Oslo lufthavn', ['Lillestrøm'])]), null)
      expect(await flyplassForhold('NSR:drammen', maal, { hent })).toBe('bak')
    })
    it('flyplassen på veien til jobbstedet er «foer»', async () => {
      const hent = lag(forslag([ben('Hamar', 'Oslo lufthavn', ['Eidsvoll'])]), forslag([ben('Hamar', 'Lillestrøm', ['Oslo lufthavn'])]))
      expect(await flyplassForhold('NSR:hamar', maal, { hent })).toBe('foer')
    })
    it('ellers er jobbstedet «utenfor»', async () => {
      const hent = lag(forslag([ben('Drammen', 'Oslo lufthavn', ['Asker'])]), forslag([ben('Drammen', 'Lillestrøm', ['Asker'])]))
      expect(await flyplassForhold('NSR:drammen', maal, { hent })).toBe('utenfor')
    })
    it('Oslo S er aldri «utenfor», selv når ikke alle avganger går via flyplassen', async () => {
      const hent = lag(forslag([ben('Hamar', 'Oslo lufthavn', ['Eidsvoll'])]), forslag([ben('Hamar', 'Oslo S', ['Lillestrøm'])]))
      expect(await flyplassForhold('NSR:hamar', {}, { hent })).toBe('foer')
    })
  })
})
