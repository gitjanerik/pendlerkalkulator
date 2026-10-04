import { tidspunkt, ukedag } from './dato.js'
import { gaarTilOsloS } from './stasjoner.js'

// Fritidsreise til Oslo lufthavn: uten gyldig periodebillett kjøpes én enkeltbillett hjemstasjon–Oslo lufthavn
// (to billetter lønner seg aldri). Med periodebillett eller eksisterende billett er det litt ulikt:
// - Flyplassen ligger bak Oslo S (fra sør): billetten dekker til Oslo S, så det kjøpes bare tillegget Oslo S–Oslo lufthavn.
// - Flyplassen ligger før Oslo S (fra nord): billetten dekker hele veien, så det koster ingenting ekstra.
// Kilde: oppgitt av eier oktober 2026 – ikke sjekket mot Vy.
// Tillegget Oslo S–Oslo lufthavn. Strekninger uten oppgitt flyplasspris bruker enkeltbillett til Oslo S pluss dette som anslag.
export const OSL_TILLEGG = 134

// Forholdet mellom jobbstedet og flyplassen på reisen hjemstasjon–Oslo lufthavn:
// - 'bak': jobbstedet ligger på veien til flyplassen. Periodebilletten dekker til jobbstedet, så det kjøpes bare tillegget videre.
// - 'foer': flyplassen ligger på veien til jobbstedet (fra nord til Oslo S). Billetten dekker hele veien.
// - 'utenfor': jobbstedet ligger ikke på veien. Periodebilletten hjelper ikke, og flyplassreisen er en vanlig enkeltbillett.
// Strekninger uten svar fra Entur: Oslo S regnes som 'bak' (vanlig fra sør), andre mål som 'utenfor'.
export const flyplassForhold = (strekning) => {
  // Oslo S er endestasjonen, så «utenfor» kan ikke stemme; lagrede strekninger med gammelt svar regnes som «før».
  if (strekning?.flyplass === 'utenfor' && strekning.navn && gaarTilOsloS(strekning)) return 'foer'
  if (strekning?.flyplass) return strekning.flyplass
  if (!strekning?.navn || gaarTilOsloS(strekning)) return strekning?.bakOsloS === false ? 'foer' : 'bak'
  return 'utenfor'
}

const tall = (v) => (Number.isFinite(Number(v)) && v !== '' && v != null ? Number(v) : null)

// Kroner som kommer på toppen av en periodebillett som dekker reisen.
export const fritidTillegg = (strekning) => {
  if (flyplassForhold(strekning) !== 'bak') return 0
  if (!strekning?.navn || gaarTilOsloS(strekning)) return OSL_TILLEGG
  return tall(strekning.tillegg) ?? 0
}

export const fritidGrunnpris = (strekning) => {
  const lufthavn = tall(strekning?.lufthavn)
  if (lufthavn != null) return lufthavn
  const enkelt = tall(strekning?.enkelt) ?? 0
  return flyplassForhold(strekning) === 'bak' ? enkelt + fritidTillegg(strekning) : enkelt
}

// Turene får grunnprisene optimereren trenger: tillegget betales alltid, resten av flyplassbilletten bare uten dekning.
// Uten dekningsmulighet ('utenfor') er hele billetten «tillegget».
const grunnpriser = (strekning) => {
  const total = fritidGrunnpris(strekning)
  if (flyplassForhold(strekning) === 'utenfor') return { tilleggGrunn: total, enkeltGrunn: 0 }
  const tillegg = fritidTillegg(strekning)
  return { tilleggGrunn: tillegg, enkeltGrunn: Math.max(0, total - tillegg) }
}

// Strekningen med nye priser lagt over de gamle; felt uten ny pris beholder den gamle.
const medNyePriser = (s) => ({ ...s, enkelt: s.nye.enkelt ?? s.enkelt, lufthavn: s.nye.lufthavn ?? s.lufthavn, tillegg: s.nye.tillegg ?? s.tillegg })

export function medFritidspriser(turer, strekning) {
  const gammel = grunnpriser(strekning)
  const ny = strekning?.nye ? grunnpriser(medNyePriser(strekning)) : null
  const priser = ny ? { ...gammel, tilleggGrunnNy: ny.tilleggGrunn, enkeltGrunnNy: ny.enkeltGrunn } : gammel
  return turer.map((t) => ({ ...t, ...priser }))
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
