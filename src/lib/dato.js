// Alle datoer er ISO-strenger (YYYY-MM-DD) og alle tidspunkter er minutter siden
// 1970-01-01 00:00 i NAIV lokaltid. Billettvarighet er «samme klokkeslett N døgn
// senere», så sommertid er med vilje ikke en del av regnestykket (se varsler.js).
const MS_DAG = 86400000
export const MIN_DOEGN = 1440

const pad = (n) => String(n).padStart(2, '0')

export function dagNr(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / MS_DAG)
}

export function isoFraDagNr(n) {
  return new Date(n * MS_DAG).toISOString().slice(0, 10)
}

export const leggTilDager = (iso, n) => isoFraDagNr(dagNr(iso) + n)

// 0 = mandag … 6 = søndag. 1970-01-01 var en torsdag.
export const ukedag = (iso) => (((dagNr(iso) + 3) % 7) + 7) % 7

export function klokkeMin(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export const tidspunkt = (iso, hhmm) => dagNr(iso) * MIN_DOEGN + klokkeMin(hhmm)

export function formaterTidspunkt(min) {
  const dag = Math.floor(min / MIN_DOEGN)
  const rest = min - dag * MIN_DOEGN
  return `${isoFraDagNr(dag)}T${pad(Math.floor(rest / 60))}:${pad(rest % 60)}`
}

export function parseTidspunkt(streng) {
  const [iso, hhmm] = streng.split('T')
  return tidspunkt(iso, hhmm)
}

export function datoerMellom(fra, til) {
  const ut = []
  for (let n = dagNr(fra); n <= dagNr(til); n++) ut.push(isoFraDagNr(n))
  return ut
}

export function sisteSondag(aar, maaned) {
  const sisteDag = Date.UTC(aar, maaned, 0) / MS_DAG
  const iso = isoFraDagNr(sisteDag)
  return isoFraDagNr(sisteDag - ((ukedag(iso) + 1) % 7))
}
