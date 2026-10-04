import { tidspunkt, ukedag } from './dato.js'
import { gaarTilOsloS } from './stasjoner.js'

// Fritidsreise til Oslo lufthavn: uten gyldig periodebillett kjøpes én enkeltbillett hjemstasjon–Oslo lufthavn
// (to billetter lønner seg aldri). Med periodebillett eller eksisterende billett er det litt ulikt:
// - Flyplassen ligger bak Oslo S (fra sør): billetten dekker til Oslo S, så det kjøpes bare tillegget Oslo S–Oslo lufthavn.
// - Flyplassen ligger før Oslo S (fra nord): billetten dekker hele veien, så det koster ingenting ekstra.
// Kilde: oppgitt av eier oktober 2026 – ikke sjekket mot Vy.
// Tillegget Oslo S–Oslo lufthavn. Strekninger uten oppgitt flyplasspris bruker enkeltbillett til Oslo S pluss dette som anslag.
export const OSL_TILLEGG = 134

// Fritidsreiser til Oslo lufthavn regnes bare for strekninger til Oslo S.
export const harFlyplass = (strekning) => !strekning || gaarTilOsloS(strekning)

export const bakOsloS = (strekning) => strekning?.bakOsloS !== false

// Kroner som kommer på toppen av en periodebillett som dekker reisen.
export const fritidTillegg = (strekning) => (bakOsloS(strekning) ? OSL_TILLEGG : 0)

export const fritidGrunnpris = (strekning) => {
  if (strekning?.lufthavn != null) return strekning.lufthavn
  if (!bakOsloS(strekning)) return Number.isFinite(strekning?.enkelt) ? strekning.enkelt : 0
  return Number.isFinite(strekning?.enkelt) ? strekning.enkelt + OSL_TILLEGG : OSL_TILLEGG
}

// Turene får grunnprisene optimereren trenger: tillegget betales alltid, resten av flyplassbilletten bare uten dekning.
export function medFritidspriser(turer, strekning) {
  const total = fritidGrunnpris(strekning)
  const tillegg = fritidTillegg(strekning)
  return turer.map((t) => ({ ...t, tilleggGrunn: tillegg, enkeltGrunn: Math.max(0, total - tillegg) }))
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
