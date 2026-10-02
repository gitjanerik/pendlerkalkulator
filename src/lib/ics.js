import { dagNr, leggTilDager } from './dato.js'

const MAKS_HENDELSER = 2000

// RFC 5545: lange linjer brytes med CRLF + mellomrom/tab.
const foldUt = (tekst) => tekst.replace(/\r?\n[ \t]/g, '').split(/\r?\n/)

const unescape = (v) => v.replace(/\\([nN,;\\])/g, (_, c) => (c.toLowerCase() === 'n' ? ' ' : c))

function lesDato(verdi) {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/.exec(verdi)
  if (!m) return null
  return { dato: `${m[1]}-${m[2]}-${m[3]}`, klokke: m[4] ? `${m[4]}:${m[5]}` : null }
}

// Leser VEVENT-er som datointervaller. Heldagshendelser har eksklusiv slutt
// (DTEND = dagen etter); tidsfestede hendelser som slutter nøyaktig 00:00
// behandles likt. Gjentakende hendelser (RRULE) utvides ikke, bare første
// forekomst tas med og telles i `gjentakende`.
export function parseIcs(tekst) {
  const hendelser = []
  let gjentakende = 0
  let ev = null
  for (const linje of foldUt(String(tekst))) {
    if (linje === 'BEGIN:VEVENT') {
      ev = { props: {} }
      continue
    }
    if (linje === 'END:VEVENT') {
      if (ev?.props.DTSTART) {
        const start = lesDato(ev.props.DTSTART.verdi)
        const slutt = ev.props.DTEND ? lesDato(ev.props.DTEND.verdi) : null
        if (start) {
          const heldag = ev.props.DTSTART.param.includes('VALUE=DATE') || start.klokke === null
          let til = start.dato
          if (slutt) {
            til = slutt.dato
            if (heldag || slutt.klokke === '00:00') til = leggTilDager(til, -1)
          }
          if (til < start.dato) til = start.dato
          if (ev.props.RRULE) gjentakende++
          if (hendelser.length < MAKS_HENDELSER) {
            hendelser.push({
              fra: start.dato,
              til,
              navn: unescape(ev.props.SUMMARY?.verdi ?? '').trim() || 'Uten tittel',
              heldag,
            })
          }
        }
      }
      ev = null
      continue
    }
    if (!ev) continue
    const kolon = linje.indexOf(':')
    if (kolon < 0) continue
    const [navn, ...param] = linje.slice(0, kolon).split(';')
    if (!(navn.toUpperCase() in ev.props)) {
      ev.props[navn.toUpperCase()] = { verdi: linje.slice(kolon + 1), param: param.map((p) => p.toUpperCase()) }
    }
  }
  hendelser.sort((a, b) => a.fra.localeCompare(b.fra) || a.til.localeCompare(b.til))
  return { hendelser, gjentakende }
}

// Slår sammen overlappende og tilstøtende intervaller til minste mulige liste.
export function slaaSammenFerie(intervaller) {
  const gyldige = intervaller
    .filter((f) => f.fra && f.til && f.til >= f.fra)
    .map((f) => ({ fra: f.fra, til: f.til }))
    .sort((a, b) => a.fra.localeCompare(b.fra))
  const ut = []
  for (const f of gyldige) {
    const sist = ut[ut.length - 1]
    if (sist && dagNr(f.fra) <= dagNr(sist.til) + 1) {
      if (f.til > sist.til) sist.til = f.til
    } else {
      ut.push({ ...f })
    }
  }
  return ut
}
