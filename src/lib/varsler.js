import { parseTidspunkt, sisteSondag, tidspunkt } from './dato.js'

// Klokka stilles klokken 03:00 lokal tid siste søndag i mars og oktober. Vi vet
// ikke om Vy teller utløp i veggklokke eller døgn, så varselet sier «kan».
export function sommertidVarsler(billetter) {
  const varsler = []
  for (const b of billetter) {
    // Årskort gjelder i hele dager, så klokkeskiftet er uten betydning der
    if (b.dager >= 365) continue
    const fra = parseTidspunkt(b.aktivering)
    const til = parseTidspunkt(b.utloper)
    const aarFra = Number(b.aktivering.slice(0, 4))
    const aarTil = Number(b.utloper.slice(0, 4))
    for (let aar = aarFra; aar <= aarTil; aar++) {
      for (const [maaned, retning] of [[3, 'sommertid'], [10, 'vintertid']]) {
        const dato = sisteSondag(aar, maaned)
        const skifte = tidspunkt(dato, '03:00')
        if (fra < skifte && skifte <= til) {
          varsler.push({
            billett: b,
            dato,
            retning,
            tekst: `Overgang til ${retning} ${dato} kan flytte utløpet av ${b.dager}-dagersbilletten med én time.`,
          })
        }
      }
    }
  }
  return varsler
}
