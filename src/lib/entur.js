// Entur: stedsøk (geocoder) og reiseforslag (Journey Planner v3). Ren logikk; nettkallet
// tas imot som parameter slik at det kan testes uten nett.
export const ENTUR_KLIENT = 'gitjanerik-pendlerkalkulator'
const GEOCODER = 'https://api.entur.io/geocoder/v1/autocomplete'
const PLANLEGGER = 'https://api.entur.io/journey-planner/v3/graphql'
const HODER = { 'ET-Client-Name': ENTUR_KLIENT }

export const stedsokUrl = (navn) =>
  `${GEOCODER}?${new URLSearchParams({ text: navn, size: '5', layers: 'venue', lang: 'no' })}`

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
