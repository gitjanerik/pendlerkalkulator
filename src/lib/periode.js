import { isoFraDagNr, dagNr } from './dato.js'

// Siste dag i en periode på N måneder fra «fra»: 2026-10-02 + 3 mnd → 2027-01-01.
// Har målmåneden ikke den datoen, brukes månedens siste dag.
export function tilEtterMaaneder(fra, mnd) {
  const [y, m, d] = fra.split('-').map(Number)
  const mal = new Date(Date.UTC(y, m - 1 + mnd, d))
  if (mal.getUTCDate() !== d) return isoFraDagNr(dagNr(mal.toISOString().slice(0, 10)) - mal.getUTCDate())
  return isoFraDagNr(dagNr(fra) + (dagNr(mal.toISOString().slice(0, 10)) - dagNr(fra)) - 1)
}
