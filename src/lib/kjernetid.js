// Fra kjernetid og reisetid til avreise: du skal være på plass når kjernetiden starter,
// og reiser hjem når den slutter.
export const STANDARD_KJERNETID = { fra: '09:00', til: '15:00' }

const tilMin = (k) => Number(k.slice(0, 2)) * 60 + Number(k.slice(3))
const tilKlokke = (min) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

// Avreise om morgenen rundes ned til nærmeste 5 minutter, så du heller er tidlig enn sen.
export function avreiseFraKjernetid(kjernetid, reisetidMin) {
  const reise = Number(reisetidMin) > 0 ? Number(reisetidMin) : 0
  const morgen = Math.floor((tilMin(kjernetid.fra) - reise) / 5) * 5
  return { morgen: tilKlokke(Math.max(morgen, 0)), ettermiddag: kjernetid.til }
}
