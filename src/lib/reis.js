import { MIN_DOEGN } from './dato.js'

// Ruter Reis: rabatt på enkeltbilletter etter hvor mange enkeltreiser du har tatt
// de siste 30 dagene. Reglene står samlet her, slik at de kan endres uten å røre
// resten. Vy Smartpris er en egen ordning og er ikke med.
// Kilde: Ruter og Vy («Reis med rabatt»), oppgitt av eier oktober 2026 – ikke sjekket mot sidene.
export const REIS_VINDU_DAGER = 30

// [minst antall reiser, rabatt i prosent], stigende. Antallet teller reisen selv,
// så første rabatt kommer på reise nummer 5.
export const REIS_TRINN = [
  [5, 5],
  [10, 10],
  [15, 15],
  [20, 20],
  [25, 25],
  [30, 30],
  [35, 35],
  [40, 40],
]

export function reisRabattProsent(antall, trinn = REIS_TRINN) {
  let prosent = 0
  for (const [fra, p] of trinn) if (antall >= fra) prosent = p
  return prosent
}

// reiser: kvalifiserende enkeltreiser { tid (minutter), pris } i vilkårlig rekkefølge.
// Returnerer samme reiser i tidsrekkefølge med antall i vinduet, rabatt og netto pris.
export function anvendReis(reiser, { vindu = REIS_VINDU_DAGER, trinn = REIS_TRINN } = {}) {
  const sortert = [...reiser].sort((a, b) => a.tid - b.tid)
  const lengde = vindu * MIN_DOEGN
  let start = 0
  return sortert.map((r, i) => {
    while (sortert[start].tid <= r.tid - lengde) start++
    const antall = i - start + 1
    const prosent = reisRabattProsent(antall, trinn)
    return { ...r, antall, prosent, netto: Math.round(r.pris * (1 - prosent / 100)) }
  })
}
