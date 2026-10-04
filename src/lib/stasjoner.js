import { PRESETS } from './presets.js'

export const MAKS_NAVN = 40
// Høyeste pris per felt i kroner. Samme tall står som max i skjemafeltene.
export const MAKS_PRIS = { enkelt: 999, lufthavn: 999, uke: 9999, maaned: 9999, aar: 99999 }

// bakOsloS: true/false fra Entur, null mens vi sjekker eller ikke fikk svar (regnes som true).
export const OSLO_S = 'Oslo S'

// navn og enturId er fra-stasjonen; til er målet (Oslo S er standard og trenger ikke Entur-id).
export const tomtSkjema = () => ({ navn: '', enturId: '', til: OSLO_S, tilEnturId: '', bakOsloS: null, enkelt: '', lufthavn: '', uke: '', maaned: '', aar: '' })

// Entur kaller dem «Asker stasjon»; i appen heter de bare «Asker».
// Tankestrek (–) skiller stasjonen fra Oslo S i strekningsnavnet, så den byttes mot bindestrek.
export const rensStasjonsnavn = (navn) => navn.replace(/\s+stasjon$/i, '').replace(/–/g, '-').trim()

export const stasjonsnavn = (s) => s.navn.split('–')[0]
// Strekningen heter «Fra–Til». Eldre lagrede strekninger har alltid Oslo S som mål.
export const maalnavn = (s) => s.navn.split('–')[1] ?? OSLO_S
export const gaarTilOsloS = (s) => maalnavn(s) === OSLO_S
// Knappen i stasjonsvalget: bare fra-stasjonen når målet er Oslo S, ellers hele strekningen.
export const strekningsvalg = (s) => (gaarTilOsloS(s) ? stasjonsnavn(s) : `${stasjonsnavn(s)}–${maalnavn(s)}`)

const normalt = (t) => t.trim().replace(/\s+/g, ' ')
const lik = (a, b) => a.toLocaleLowerCase('nb') === b.toLocaleLowerCase('nb')

// Tom streng betyr «ikke oppgitt». Gir { felt: melding } for hvert felt med feil.
export function validerStasjon(skjema, egne = [], redigerer = null) {
  const feil = {}
  const navn = normalt(String(skjema.navn ?? ''))
  // Bare stasjoner valgt fra Enturs søk er gyldige, så navnet alltid er offisielt.
  if (!navn) feil.navn = 'Søk etter stasjonen og velg den fra listen.'
  else if (!skjema.enturId) feil.navn = 'Velg stasjonen fra listen med forslag fra Entur.'
  else if (navn.length > MAKS_NAVN) feil.navn = `Navnet kan ha høyst ${MAKS_NAVN} tegn.`

  const til = normalt(String(skjema.til ?? ''))
  if (!til) feil.til = 'Søk etter målstasjonen og velg den fra listen.'
  else if (!lik(til, OSLO_S) && !skjema.tilEnturId) feil.til = 'Velg målstasjonen fra listen med forslag fra Entur.'
  else if (til.length > MAKS_NAVN) feil.til = `Navnet kan ha høyst ${MAKS_NAVN} tegn.`
  else if (navn && lik(navn, til)) feil.til = 'Fra og til kan ikke være samme stasjon.'

  if (!feil.navn && !feil.til) {
    const andre = [...PRESETS, ...egne.filter((e) => e.id !== redigerer)]
    if (andre.some((a) => lik(stasjonsnavn(a), navn) && lik(maalnavn(a), til))) feil.til = 'Du har allerede denne strekningen.'
  }
  const tilOslo = lik(til, OSLO_S)

  const tall = (verdi, felt, { paakrevd, tekst }) => {
    if (verdi === '' || verdi == null) {
      if (paakrevd) feil[felt] = `Fyll inn ${tekst}.`
      return null
    }
    const n = Number(verdi)
    if (!Number.isInteger(n) || n <= 0) feil[felt] = 'Prisen må være et helt beløp over 0 kr.'
    else if (n > MAKS_PRIS[felt]) feil[felt] = `Prisen kan ikke være over ${MAKS_PRIS[felt]} kr.`
    else return n
    return null
  }
  const enkelt = tall(skjema.enkelt, 'enkelt', { paakrevd: true, tekst: 'prisen på enkeltbillett' })
  // Ligger flyplassen før Oslo S, er prisen ikke noe vi kan regne ut fra enkeltbilletten.
  tall(skjema.lufthavn, 'lufthavn', { paakrevd: tilOslo && skjema.bakOsloS === false, tekst: 'prisen på enkeltbillett til Oslo lufthavn' })
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
    enturId: skjema.enturId,
    tilEnturId: skjema.tilEnturId ?? '',
    bakOsloS: skjema.bakOsloS !== false,
    navn: `${normalt(skjema.navn)}–${normalt(skjema.til)}`,
    bil: false,
    ruter: false,
    enkelt: Number(skjema.enkelt),
    lufthavn: lik(normalt(skjema.til), OSLO_S) ? tallEllerTom(skjema.lufthavn) : '',
    perioder,
  }
}

export function skjemaFraStasjon(s) {
  const pris = (dager) => s.perioder.find((p) => p.dager === dager)?.pris ?? ''
  return { navn: stasjonsnavn(s), enturId: s.enturId ?? '', til: maalnavn(s), tilEnturId: s.tilEnturId ?? '', bakOsloS: s.bakOsloS !== false, enkelt: s.enkelt ?? '', lufthavn: s.lufthavn ?? '', uke: pris(7), maaned: pris(30), aar: pris(365) }
}

export function nyStasjonsId(egne) {
  let n = egne.length + 1
  while (egne.some((e) => e.id === `egen-${n}`)) n++
  return `egen-${n}`
}
