import { leggTilDager, leggTilMaaneder } from './dato.js'

export const STANDARD_PRISOKNING = { paa: true, prosent: 4, dato: '02-01' }

// Antall prisøkninger som har trådt i kraft etter prisDato og senest på dato.
export function antallPrisokninger(prisDato, dato, prisokning) {
  let antall = 0
  for (let aar = Number(prisDato.slice(0, 4)); aar <= Number(dato.slice(0, 4)); aar++) {
    const dag = `${aar}-${prisokning.dato}`
    if (dag > prisDato && dag <= dato) antall++
  }
  return antall
}

export function prisPaaDato(grunnpris, prisDato, dato, prisokning = STANDARD_PRISOKNING) {
  if (!prisokning.paa) return grunnpris
  const n = antallPrisokninger(prisDato, dato, prisokning)
  return Math.round(grunnpris * (1 + prisokning.prosent / 100) ** n)
}

// Årskort kjøpt siste dag før neste økning mot første dag etter.
export function aarskortFoerEtter(grunnpris, prisDato, fraDato, prisokning) {
  const aar = Number(fraDato.slice(0, 4))
  const dag = `${aar}-${prisokning.dato}`
  const okning = dag > fraDato ? dag : `${aar + 1}-${prisokning.dato}`
  const foerDato = leggTilDager(okning, -1)
  const foer = prisPaaDato(grunnpris, prisDato, foerDato, prisokning)
  const etter = prisPaaDato(grunnpris, prisDato, okning, prisokning)
  return { foerDato, foer, etterDato: okning, etter, differanse: etter - foer }
}

// Prisene regnes som gamle etter tre måneder.
export const prisAlderMaaneder = 3
export const prisErGamle = (prisDato, idag) => /^\d{4}-\d{2}-\d{2}$/.test(prisDato ?? '') && leggTilMaaneder(prisDato, prisAlderMaaneder) < idag

// Januar-påminnelsen: Vy hever prisene 1. februar. Skjules når prisene er registrert i år, eller varselet er lukket i år.
export const visJanuarVarsel = (prisDato, lukketAar, idag) =>
  idag.slice(5, 7) === '01' && lukketAar !== idag.slice(0, 4) && !(prisDato >= `${idag.slice(0, 4)}-01-01`)
