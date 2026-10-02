import { ukedag } from './dato.js'

const MAANEDER = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des']
const UKEDAGER = ['man', 'tir', 'ons', 'tor', 'fre', 'lør', 'søn']

export const UKEDAG_NAVN = UKEDAGER

// Tusenskille er hardt mellomrom, så beløp aldri brytes midt i.
export const kr = (n) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} kr`

// «365 dager (årskort)», ellers «30 dager»
export const dagerTekst = (n) => (n >= 365 ? `${n} dager (årskort)` : `${n} dager`)

export function norskDato(iso, medAar = false) {
  const [aar, maaned, dag] = iso.split('-').map(Number)
  const tekst = `${UKEDAGER[ukedag(iso)]} ${dag}. ${MAANEDER[maaned - 1]}`
  return medAar ? `${tekst} ${aar}` : tekst
}

// «2026-10-12T07:00» → «man 12. okt kl. 07:00»
export function norskTidspunkt(tekst) {
  const [dato, klokke] = tekst.split('T')
  return `${norskDato(dato)} kl. ${klokke}`
}
