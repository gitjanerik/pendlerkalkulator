import { leggTilDager } from './dato.js'

const pad = (n) => String(n).padStart(2, '0')

// Anonym gregoriansk algoritme (Meeus/Jones/Butcher).
export function paaskedag(aar) {
  const a = aar % 19
  const b = Math.floor(aar / 100)
  const c = aar % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const maaned = Math.floor((h + l - 7 * m + 114) / 31)
  const dag = ((h + l - 7 * m + 114) % 31) + 1
  return `${aar}-${pad(maaned)}-${pad(dag)}`
}

// Offentlige fridager. Julaften og nyttårsaften er ikke med: de er arbeidsgiverens valg.
export function norskeHelligdager(aar) {
  const p = paaskedag(aar)
  const rel = (n) => leggTilDager(p, n)
  return {
    [`${aar}-01-01`]: 'Nyttårsdag',
    [rel(-3)]: 'Skjærtorsdag',
    [rel(-2)]: 'Langfredag',
    [p]: '1. påskedag',
    [rel(1)]: '2. påskedag',
    [`${aar}-05-01`]: 'Arbeidernes dag',
    [`${aar}-05-17`]: 'Grunnlovsdag',
    [rel(39)]: 'Kristi himmelfartsdag',
    [rel(49)]: '1. pinsedag',
    [rel(50)]: '2. pinsedag',
    [`${aar}-12-25`]: '1. juledag',
    [`${aar}-12-26`]: '2. juledag',
  }
}

// Mandag–onsdag før palmesøndag-uka slutter: mandag er 1. påskedag − 6.
export function paaskeukeMandagOnsdag(aar) {
  const p = paaskedag(aar)
  return [leggTilDager(p, -6), leggTilDager(p, -5), leggTilDager(p, -4)]
}
