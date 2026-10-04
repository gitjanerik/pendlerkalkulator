// Entur: stedsøk (geocoder) og reiseforslag (Journey Planner v3). Ren logikk; nettkallet
// tas imot som parameter slik at det kan testes uten nett.
import { leggTilDager, ukedag } from './dato.js'

export const ENTUR_KLIENT = 'gitjanerik-pendlerkalkulator'
const GEOCODER = 'https://api.entur.io/geocoder/v1/autocomplete'
const PLANLEGGER = 'https://api.entur.io/journey-planner/v3/graphql'
const HODER = { 'ET-Client-Name': ENTUR_KLIENT }

export const stedsokUrl = (navn, antall = 5) =>
  `${GEOCODER}?${new URLSearchParams({ text: navn, size: String(antall), layers: 'venue', lang: 'no' })}`

// Første treff som er en jernbanestasjon.
export function velgStasjon(json) {
  const f = (json?.features ?? []).find((x) => [].concat(x.properties?.category ?? []).includes('railStation'))
  return f ? { id: f.properties.id, navn: f.properties.name } : null
}

export const TUR_SPORING = `query ($fra: String!, $til: String!, $n: Int!) {
  trip(from: { place: $fra }, to: { place: $til }, numTripPatterns: $n,
       modes: { transportModes: [{ transportMode: rail }] }) {
    tripPatterns {
      aimedStartTime expectedStartTime expectedEndTime
      legs { mode realtime line { publicCode } fromEstimatedCall { cancellation } }
    }
  }
}`

const minutter = (a, b) => Math.round((new Date(a) - new Date(b)) / 60000)

export function tolkAvganger(json) {
  if (json?.errors?.length) throw new Error(json.errors[0].message ?? 'Entur svarte med feil')
  return (json?.data?.trip?.tripPatterns ?? []).map((t) => {
    const tog = t.legs.filter((l) => l.mode === 'rail')
    return {
      start: t.expectedStartTime,
      slutt: t.expectedEndTime,
      forsinkelseMin: minutter(t.expectedStartTime, t.aimedStartTime),
      linjer: tog.map((l) => l.line?.publicCode).filter(Boolean),
      bytter: Math.max(tog.length - 1, 0),
      innstilt: t.legs.some((l) => l.fromEstimatedCall?.cancellation),
      sanntid: t.legs.some((l) => l.realtime),
    }
  })
}

// «2026-10-05T07:12:00+02:00» → «07:12» i norsk tid, uansett hvor nettleseren står.
export const klokke = (iso) =>
  new Intl.DateTimeFormat('nb-NO', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Oslo', hourCycle: 'h23' }).format(
    new Date(iso),
  )

async function json(hent, url, init) {
  const svar = await hent(url, init)
  if (!svar.ok) throw new Error(`Entur svarte ${svar.status}`)
  return svar.json()
}

// Alle jernbanestasjoner i et stedsøk, med kommune eller fylke til å skille like navn.
export function stasjonsForslag(json) {
  const sett = new Set()
  return (json?.features ?? [])
    .filter((x) => [].concat(x.properties?.category ?? []).includes('railStation'))
    .map((x) => ({ id: x.properties.id, navn: x.properties.name, sted: x.properties.locality ?? x.properties.county ?? '' }))
    .filter((f) => f.id && f.navn && !sett.has(f.id) && sett.add(f.id))
}

export const sokStasjoner = async (tekst, hent = fetch, signal) =>
  stasjonsForslag(await json(hent, stedsokUrl(tekst, 10), { headers: HODER, signal }))

// Ligger Oslo S på veien fra hjemstasjonen til Oslo lufthavn? Fra sør gjør den det; fra nord (Hamar, Eidsvoll)
// ligger flyplassen før Oslo S. Spørsmålet gjelder reiseveien, ikke priser.
export const FLYPLASS_RUTE = `query ($fra: String!, $til: String!) {
  trip(from: { place: $fra }, to: { place: $til }, numTripPatterns: 3,
       modes: { transportModes: [{ transportMode: rail }] }) {
    tripPatterns {
      legs {
        fromPlace { name quay { stopPlace { id } } }
        toPlace { name quay { stopPlace { id } } }
        intermediateQuays { name stopPlace { id } }
      }
    }
  }
}`

const erOsloS = (sted, osloSId) => sted?.name === 'Oslo S' || (osloSId && (sted?.stopPlace?.id ?? sted?.quay?.stopPlace?.id) === osloSId)

// true: alle forslagene går via Oslo S. false: minst ett går uten. null: ingen reiser funnet.
export function passererOsloS(json, osloSId) {
  const forslag = json?.data?.trip?.tripPatterns ?? []
  if (!forslag.length) return null
  const via = forslag.map((f) => f.legs.some((l) => [l.fromPlace, l.toPlace, ...(l.intermediateQuays ?? [])].some((q) => erOsloS(q, osloSId))))
  return via.every(Boolean)
}

export async function flyplassBakOsloS(stasjonId, { hent = fetch, signal } = {}) {
  const [oslo, lufthavn] = await Promise.all([finnStasjon('Oslo S', hent, signal), finnStasjon('Oslo lufthavn', hent, signal)])
  if (!lufthavn) return null
  const svar = await json(hent, PLANLEGGER, {
    method: 'POST',
    headers: { ...HODER, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: FLYPLASS_RUTE, variables: { fra: stasjonId, til: lufthavn.id } }),
    signal,
  })
  return passererOsloS(svar, oslo?.id)
}

export const finnStasjon = async (navn, hent = fetch, signal) =>
  velgStasjon(await json(hent, stedsokUrl(navn), { headers: HODER, signal }))

export async function hentAvganger(fraId, tilId, { hent = fetch, n = 4, signal } = {}) {
  const svar = await json(hent, PLANLEGGER, {
    method: 'POST',
    headers: { ...HODER, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: TUR_SPORING, variables: { fra: fraId, til: tilId, n } }),
    signal,
  })
  return tolkAvganger(svar)
}

// Forslag til faste avganger: første tog fra brukerens ønskede klokkeslett, i hver retning.
export const FORSLAG = { morgen: '07:00', ettermiddag: '16:00' }

export const TUR_FORSLAG = `query ($fra: String!, $til: String!, $n: Int!, $tid: DateTime!, $ankomst: Boolean!) {
  trip(from: { place: $fra }, to: { place: $til }, numTripPatterns: $n, dateTime: $tid, arriveBy: $ankomst,
       modes: { transportModes: [{ transportMode: rail }] }) {
    tripPatterns {
      aimedStartTime expectedStartTime expectedEndTime
      legs { mode realtime line { publicCode } fromEstimatedCall { cancellation } }
    }
  }
}`

// Neste hverdag etter idag (fredag og helg gir mandag).
export function nesteArbeidsdag(idag) {
  let d = leggTilDager(idag, 1)
  while (ukedag(d) > 4) d = leggTilDager(d, 1)
  return d
}

// «2026-10-05» + «08:55» → «2026-10-05T08:55:00+02:00» med riktig norsk forskyvning.
export function osloTid(dato, hhmm) {
  const del = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Oslo', timeZoneName: 'longOffset' })
    .formatToParts(new Date(`${dato}T${hhmm}:00Z`))
    .find((x) => x.type === 'timeZoneName')?.value
  const forskyvning = del && del !== 'GMT' ? del.slice(3) : '+00:00'
  return `${dato}T${hhmm}:00${forskyvning}`
}

// ankomst: siste tog som er fremme senest på grensen. Ellers: første tog som går fra grensen.
export function velgAvgang(avganger, { ankomst, grense }) {
  const g = new Date(grense).getTime()
  const mulige = avganger.filter((a) => !a.innstilt)
  const treff = ankomst
    ? mulige.filter((a) => new Date(a.slutt).getTime() <= g).sort((a, b) => new Date(b.start) - new Date(a.start))
    : mulige.filter((a) => new Date(a.start).getTime() >= g).sort((a, b) => new Date(a.start) - new Date(b.start))
  return treff[0] ?? null
}

export function velgForslag(avganger, valg) {
  const a = velgAvgang(avganger, valg)
  return a ? klokke(a.start) : null
}

async function forslag(fraId, tilId, grense, ankomst, hent, signal) {
  const svar = await json(hent, PLANLEGGER, {
    method: 'POST',
    headers: { ...HODER, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: TUR_FORSLAG, variables: { fra: fraId, til: tilId, n: 5, tid: grense, ankomst } }),
    signal,
  })
  return velgAvgang(tolkAvganger(svar), { ankomst, grense })
}

export async function foreslaaAvganger(hjemId, osloId, idag, { morgen = FORSLAG.morgen, ettermiddag = FORSLAG.ettermiddag, hent = fetch, signal } = {}) {
  const dato = nesteArbeidsdag(idag)
  const [ut, hjem] = await Promise.all([
    forslag(hjemId, osloId, osloTid(dato, morgen), false, hent, signal),
    forslag(osloId, hjemId, osloTid(dato, ettermiddag), false, hent, signal),
  ])
  return { morgen: ut ? klokke(ut.start) : null, ettermiddag: hjem ? klokke(hjem.start) : null }
}
