import { datoerMellom, ukedag } from './dato.js'
import { norskeHelligdager, paaskeukeMandagOnsdag } from './helligdager.js'

export const STANDARD_INNSTILLINGER = {
  jobberPaaskeMandagOnsdag: false,
  jobberRomjul: false,
}

const aarAv = (iso) => Number(iso.slice(0, 4))
const erIFerie = (iso, ferie) =>
  ferie.some((f) => (typeof f === 'string' ? f === iso : iso >= f.fra && iso <= f.til))

// Prioritet: ekstra arbeidsdag > helg > helligdag > ekstra fri > ferie >
// hjemmekontor > julaften > romjul (27.–30.12) > påskeuke (man–ons) > arbeid.
export function byggKalender({
  fra,
  til,
  innstillinger = {},
  ferie = [],
  hjemmekontor = [],
  ekstraArbeidsdager = [],
  ekstraFri = [],
}) {
  const valg = { ...STANDARD_INNSTILLINGER, ...innstillinger }
  const helligdagerPerAar = new Map()
  const paaskeukePerAar = new Map()
  const helligdager = (aar) => {
    if (!helligdagerPerAar.has(aar)) helligdagerPerAar.set(aar, norskeHelligdager(aar))
    return helligdagerPerAar.get(aar)
  }
  const paaskeuke = (aar) => {
    if (!paaskeukePerAar.has(aar)) paaskeukePerAar.set(aar, paaskeukeMandagOnsdag(aar))
    return paaskeukePerAar.get(aar)
  }
  const ekstraArbeid = new Set(ekstraArbeidsdager)
  const ekstraFriSett = new Set(ekstraFri)
  const hjemme = new Set(hjemmekontor)

  return datoerMellom(fra, til).map((dato) => {
    const aar = aarAv(dato)
    const md = dato.slice(5)
    if (ekstraArbeid.has(dato)) return { dato, type: 'arbeid' }
    if (ukedag(dato) >= 5) return { dato, type: 'helg' }
    const helligdag = helligdager(aar)[dato]
    if (helligdag) return { dato, type: 'helligdag', navn: helligdag }
    if (ekstraFriSett.has(dato)) return { dato, type: 'fri' }
    if (erIFerie(dato, ferie)) return { dato, type: 'ferie' }
    if (hjemme.has(dato)) return { dato, type: 'hjemmekontor' }
    if (md === '12-24') return { dato, type: 'fri', navn: 'Julaften' }
    if (!valg.jobberRomjul && md >= '12-27' && md <= '12-30') {
      return { dato, type: 'fri', navn: 'Romjul' }
    }
    if (!valg.jobberPaaskeMandagOnsdag && paaskeuke(aar).includes(dato)) {
      return { dato, type: 'fri', navn: 'Påskeuke' }
    }
    return { dato, type: 'arbeid' }
  })
}

export const reisedager = (kalender) => kalender.filter((d) => d.type === 'arbeid')
