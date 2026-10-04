import { PRESETS } from './presets.js'

export const MAKS_NAVN = 40
const MAKS_PRIS = 100000
// Bokstaver, tall, mellomrom, punktum, apostrof og bindestrek. Tankestrek (–) skiller stasjon og Oslo S i strekningsnavnet, så den er ikke tillatt.
const NAVN = /^[\p{L}\p{N}][\p{L}\p{N} .'-]*$/u

export const tomtSkjema = () => ({ navn: '', enkelt: '', lufthavn: '', uke: '', maaned: '', aar: '' })

// Entur kaller dem «Asker stasjon»; i appen heter de bare «Asker».
export const rensStasjonsnavn = (navn) => navn.replace(/\s+stasjon$/i, '').trim()

export const stasjonsnavn = (s) => s.navn.split('–')[0]

const normalt = (t) => t.trim().replace(/\s+/g, ' ')
const lik = (a, b) => a.toLocaleLowerCase('nb') === b.toLocaleLowerCase('nb')

// Tom streng betyr «ikke oppgitt». Gir { felt: melding } for hvert felt med feil.
export function validerStasjon(skjema, egne = [], redigerer = null) {
  const feil = {}
  const navn = normalt(String(skjema.navn ?? ''))
  if (!navn) feil.navn = 'Skriv inn navnet på stasjonen.'
  else if (navn.length > MAKS_NAVN) feil.navn = `Navnet kan ha høyst ${MAKS_NAVN} tegn.`
  else if (!NAVN.test(navn)) feil.navn = 'Bruk bokstaver, tall, mellomrom, punktum, apostrof eller bindestrek.'
  else if (/^oslo( s)?$/i.test(navn)) feil.navn = 'Oslo S er målet. Skriv hjemstasjonen.'
  else {
    const andre = [...PRESETS.map(stasjonsnavn), ...egne.filter((e) => e.id !== redigerer).map(stasjonsnavn)]
    if (andre.some((a) => lik(a, navn))) feil.navn = 'Du har allerede en stasjon med dette navnet.'
  }

  const tall = (verdi, felt, { paakrevd, tekst }) => {
    if (verdi === '' || verdi == null) {
      if (paakrevd) feil[felt] = `Fyll inn ${tekst}.`
      return null
    }
    const n = Number(verdi)
    if (!Number.isInteger(n) || n <= 0) feil[felt] = 'Prisen må være et helt beløp over 0 kr.'
    else if (n > MAKS_PRIS) feil[felt] = `Prisen kan ikke være over ${MAKS_PRIS.toLocaleString('nb').replace(/\s/g, ' ')} kr.`
    else return n
    return null
  }
  const enkelt = tall(skjema.enkelt, 'enkelt', { paakrevd: true, tekst: 'prisen på enkeltbillett' })
  tall(skjema.lufthavn, 'lufthavn', { paakrevd: false })
  const uke = tall(skjema.uke, 'uke', { paakrevd: true, tekst: 'prisen på ukeskort' })
  const maaned = tall(skjema.maaned, 'maaned', { paakrevd: true, tekst: 'prisen på månedskort' })
  const aar = tall(skjema.aar, 'aar', { paakrevd: false })

  // Lengre billetter skal være dyrere enn kortere, ellers er tallene byttet om eller feil.
  if (uke && maaned && maaned < uke && !feil.maaned) feil.maaned = 'Månedskortet må koste mer enn ukeskortet.'
  if (maaned && aar && aar < maaned && !feil.aar) feil.aar = 'Årskortet må koste mer enn månedskortet.'
  if (enkelt && uke && uke < enkelt && !feil.uke) feil.uke = 'Ukeskortet må koste mer enn én enkeltbillett.'
  return feil
}

const tallEllerTom = (v) => (v === '' || v == null ? '' : Number(v))

// Stasjon lagret i modellen (samme form som en strekning) fra et gyldig skjema.
export function byggStasjon(skjema, id) {
  const perioder = [[7, skjema.uke], [30, skjema.maaned], [365, skjema.aar]]
    .filter(([, pris]) => pris !== '' && pris != null)
    .map(([dager, pris]) => ({ dager, pris: Number(pris) }))
  return {
    id,
    navn: `${normalt(skjema.navn)}–Oslo S`,
    bil: false,
    ruter: false,
    enkelt: Number(skjema.enkelt),
    lufthavn: tallEllerTom(skjema.lufthavn),
    perioder,
  }
}

export function skjemaFraStasjon(s) {
  const pris = (dager) => s.perioder.find((p) => p.dager === dager)?.pris ?? ''
  return { navn: stasjonsnavn(s), enkelt: s.enkelt ?? '', lufthavn: s.lufthavn ?? '', uke: pris(7), maaned: pris(30), aar: pris(365) }
}

export function nyStasjonsId(egne) {
  let n = egne.length + 1
  while (egne.some((e) => e.id === `egen-${n}`)) n++
  return `egen-${n}`
}
