import { tidspunkt } from './dato.js'

// En arbeidsdag er to reiser (morgen og ettermiddag) med hver sin avgangstid.
// bilDager: 'alle' eller en mengde ISO-datoer der bil er tilgjengelig; strekninger
// med bil: true kan bare brukes disse dagene.
export function byggTurer(
  dager,
  {
    morgen = '07:00',
    ettermiddag = '16:00',
    retninger = 'begge',
    fraTidspunkt = null,
    bilDager = new Set(),
  } = {},
) {
  const turer = []
  for (const { dato } of dager) {
    const bil = bilDager === 'alle' || (bilDager instanceof Set && bilDager.has(dato))
    if (retninger !== 'ettermiddag') {
      turer.push({ dato, retning: 'morgen', tid: tidspunkt(dato, morgen), bil })
    }
    if (retninger !== 'morgen') {
      turer.push({ dato, retning: 'ettermiddag', tid: tidspunkt(dato, ettermiddag), bil })
    }
  }
  turer.sort((a, b) => a.tid - b.tid)
  return fraTidspunkt === null ? turer : turer.filter((t) => t.tid >= fraTidspunkt)
}
