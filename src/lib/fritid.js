import { tidspunkt, ukedag } from './dato.js'
import { antallPrisokninger, prisPaaDato } from './priser.js'

// Fritidsreise til Oslo lufthavn kjøpes som én enkeltbillett hjemstasjon–Oslo lufthavn.
// To billetter (til Oslo S og tillegg videre) lønner seg aldri, og periodebilletten teller ikke med.
// Kilde: oppgitt av eier oktober 2026 – ikke sjekket mot Vy.
export const OSL_PRISER = {
  gulskogen: 308,
  drammen: 298,
  brakeroya: 295,
  lier: 283,
  asker: 162,
  heggedal: 162,
  royken: 162,
  spikkestad: 162,
}
// Egne strekninger uten kjent pris: enkeltbillett til Oslo S pluss tillegget Oslo S–Oslo lufthavn.
export const OSL_TILLEGG = 134

export const fritidGrunnpris = (strekning) => OSL_PRISER[strekning?.id] ?? (Number.isFinite(strekning?.enkelt) ? strekning.enkelt + OSL_TILLEGG : OSL_TILLEGG)

export function prisFritidsturer(turer, strekning, prisDato, prisokning) {
  const grunn = fritidGrunnpris(strekning)
  return turer.map((t) => ({
    dato: t.dato,
    retning: t.retning,
    tid: t.tid,
    pris: prisPaaDato(grunn, prisDato, t.dato, prisokning),
    estimert: Boolean(prisokning?.paa) && antallPrisokninger(prisDato, t.dato, prisokning) > 0,
  }))
}

// Hver registrerte reise er et par: ned en dag og hjem en annen (eller samme) dag.
// Klokkeslettet er avreisen fra hjemstasjonen (ned) og fra Oslo S (hjem), som for jobbreiser.
// Turene som ligger før startpunktet er allerede tatt og regnes ikke med.
export function byggFritidsturer(reiser, { fra, til, fraKlokke, morgen, ettermiddag, bilUkedager = new Set() }) {
  const start = tidspunkt(fra, fraKlokke)
  const turer = []
  for (const r of reiser) {
    for (const [dato, retning, klokke] of [
      [r.fra, 'ned', morgen],
      [r.til, 'hjem', ettermiddag],
    ]) {
      const tid = tidspunkt(dato, klokke)
      if (dato > til || tid < start) continue
      turer.push({ dato, retning, tid, bil: bilUkedager.has(ukedag(dato)), fritid: true })
    }
  }
  return turer.sort((a, b) => a.tid - b.tid)
}
