import { dagNr, isoFraDagNr, klokkeMin, ukedag, MIN_DOEGN, parseTidspunkt } from './dato.js'

// ISO 8601-ukenummer: uka tilhører året der torsdagen ligger.
export function isoUke(iso) {
  const torsdag = dagNr(iso) - ukedag(iso) + 3
  const aar = Number(isoFraDagNr(torsdag).slice(0, 4))
  return Math.floor((torsdag - dagNr(`${aar}-01-01`)) / 7) + 1
}

// Andel av reisene en full arbeidsuke (man–fre, alle avganger) ville gitt i
// billettens gyldighet. Hjemmekontor, ferie og fridager drar den ned.
export function utnyttelse(billett, { morgen, ettermiddag, retninger }) {
  const fra = parseTidspunkt(billett.aktivering)
  const til = parseTidspunkt(billett.utloper)
  const avganger = [
    ...(retninger !== 'ettermiddag' ? [klokkeMin(morgen)] : []),
    ...(retninger !== 'morgen' ? [klokkeMin(ettermiddag)] : []),
  ]
  let mulige = 0
  for (let dag = Math.floor(fra / MIN_DOEGN); dag <= Math.floor(til / MIN_DOEGN); dag++) {
    if (ukedag(isoFraDagNr(dag)) >= 5) continue
    for (const min of avganger) {
      const tid = dag * MIN_DOEGN + min
      if (tid >= fra && tid <= til) mulige++
    }
  }
  return mulige ? Math.min(billett.antallTurer / mulige, 1) : 0
}
