import { tidspunkt, ukedag } from './dato.js'

// Fritidsreise til Oslo lufthavn: uten gyldig periodebillett kjøpes én enkeltbillett hjemstasjon–Oslo lufthavn
// (to billetter lønner seg aldri). Med periodebillett eller eksisterende billett kjøpes bare tillegget Oslo S–Oslo lufthavn.
// Kilde: oppgitt av eier oktober 2026 – ikke sjekket mot Vy.
// Tillegget Oslo S–Oslo lufthavn. Strekninger uten oppgitt flyplasspris bruker enkeltbillett til Oslo S pluss dette som anslag.
export const OSL_TILLEGG = 134

export const fritidGrunnpris = (strekning) => strekning?.lufthavn ?? (Number.isFinite(strekning?.enkelt) ? strekning.enkelt + OSL_TILLEGG : OSL_TILLEGG)

// Turene får grunnprisene optimereren trenger: tillegget betales alltid, resten av flyplassbilletten bare uten dekning.
export function medFritidspriser(turer, strekning) {
  const total = fritidGrunnpris(strekning)
  return turer.map((t) => ({ ...t, tilleggGrunn: OSL_TILLEGG, enkeltGrunn: Math.max(0, total - OSL_TILLEGG) }))
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
