import { tidspunkt, ukedag } from './dato.js'

// Fritidsreise til Oslo lufthavn: periodebilletten til/fra Oslo S gjelder fram til
// Oslo S, så det som mangler er tilleggsbilletten Oslo S–Oslo lufthavn.
// Kilde: oppgitt av eier oktober 2026 – ikke sjekket mot Vy.
export const OSL_TILLEGG = 134

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
