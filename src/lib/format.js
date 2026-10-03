import { ukedag } from './dato.js'

const MAANEDER = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des']
const UKEDAGER = ['man', 'tir', 'ons', 'tor', 'fre', 'lør', 'søn']

export const UKEDAG_NAVN = UKEDAGER
export const MAANED_NAVN = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember']
export const UKEDAG_LANGE = ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag']

// Tusenskille er hardt mellomrom, så beløp aldri brytes midt i.
export const kr = (n) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} kr`

// flertall(1, 'billett', 'billetter') → «1 billett», ellers «N billetter»
export const flertall = (n, entall, flere) => `${n} ${n === 1 ? entall : flere}`

// «365 dager (årskort)», ellers «30 dager»
export const dagerTekst = (n) => (n >= 365 ? `${n} dager (årskort)` : `${n} dager`)

export function norskDato(iso, medAar = false) {
  const [aar, maaned, dag] = iso.split('-').map(Number)
  const tekst = `${UKEDAGER[ukedag(iso)]} ${dag}. ${MAANEDER[maaned - 1]}`
  return medAar ? `${tekst} ${aar}` : tekst
}

// Skjermlesere leser «man» og «okt» som bokstaver; hele navn gir «mandag 12. oktober 2026».
export function norskDatoLang(iso) {
  const [aar, maaned, dag] = iso.split('-').map(Number)
  return `${UKEDAG_LANGE[ukedag(iso)]} ${dag}. ${MAANED_NAVN[maaned - 1]} ${aar}`
}

// «2026-10-12T07:00» → «man 12. okt kl. 07:00»
export function norskTidspunkt(tekst) {
  const [dato, klokke] = tekst.split('T')
  return `${norskDato(dato)} kl. ${klokke}`
}
