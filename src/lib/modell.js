import { byggKalender, reisedager, STANDARD_INNSTILLINGER } from './kalender.js'
import { byggTurer } from './turer.js'
import { leggTilDager, tidspunkt, ukedag } from './dato.js'
import { STANDARD_PRISOKNING } from './priser.js'
import { aarskortAnalyse, sammenlignAlternativer } from './optimerer.js'
import { sommertidVarsler } from './varsler.js'

const ISO = /^\d{4}-\d{2}-\d{2}$/
const KLOKKE = /^([01]\d|2[0-3]):[0-5]\d$/
const MAKS_DAGER = 800

// Startverdiene er et eksempel brukeren skriver over; prisene er Vys for
// Gulskogen–Oslo S høsten 2026.
export function standardModell(idag) {
  return {
    versjon: 1,
    fra: idag,
    fraKlokke: '00:00',
    til: leggTilDager(idag, 90),
    morgen: '07:00',
    ettermiddag: '16:00',
    retninger: 'begge',
    innstillinger: { ...STANDARD_INNSTILLINGER },
    ferie: [],
    bilUkedager: [0, 1, 2, 3, 4],
    prisokning: { ...STANDARD_PRISOKNING },
    prisDato: idag,
    inkluderAarskort: true,
    strekninger: [
      {
        id: 'eksempel',
        navn: 'Gulskogen–Oslo S',
        bil: false,
        enkelt: 156,
        perioder: [
          { dager: 7, pris: 827 },
          { dager: 30, pris: 2038 },
          { dager: 365, pris: 20380 },
        ],
      },
    ],
  }
}

export function normaliserStrekninger(strekninger) {
  return strekninger
    .map((s) => ({
      id: s.id,
      navn: String(s.navn ?? '').trim() || 'Uten navn',
      bil: Boolean(s.bil),
      enkelt: Number(s.enkelt) > 0 ? Number(s.enkelt) : Infinity,
      perioder: s.perioder
        .map((p) => ({ dager: Number(p.dager), pris: Number(p.pris) }))
        .filter((p) => Number.isInteger(p.dager) && p.dager > 0 && p.pris > 0),
    }))
    .filter((s) => s.enkelt !== Infinity || s.perioder.length)
}

const tom = (feil) => ({ feil, resultat: null })

// Ren funksjon fra skjemaets tilstand til alt UI-et viser.
export function beregn(modell) {
  const { fra, til, fraKlokke } = modell
  if (!ISO.test(fra ?? '') || !ISO.test(til ?? '')) return tom('Velg start- og sluttdato.')
  if (til < fra) return tom('Sluttdatoen er før startdatoen.')
  if (!KLOKKE.test(fraKlokke ?? '')) return tom('Startklokkeslettet er ugyldig.')
  if (!KLOKKE.test(modell.morgen) || !KLOKKE.test(modell.ettermiddag)) {
    return tom('Avgangstidene er ugyldige.')
  }
  const strekninger = normaliserStrekninger(modell.strekninger)
  if (!strekninger.length) return tom('Legg inn pris for minst én strekning.')

  const ferie = modell.ferie.filter((f) => ISO.test(f.fra) && ISO.test(f.til) && f.til >= f.fra)
  const kalender = byggKalender({
    fra,
    til,
    innstillinger: modell.innstillinger,
    ferie,
  })
  if (kalender.length > MAKS_DAGER) return tom(`Velg en periode på høyst ${MAKS_DAGER} dager.`)

  const dager = reisedager(kalender)
  const bilUkedager = new Set(modell.bilUkedager)
  const bilDager = new Set(dager.filter((d) => bilUkedager.has(ukedag(d.dato))).map((d) => d.dato))
  const turer = byggTurer(dager, {
    morgen: modell.morgen,
    ettermiddag: modell.ettermiddag,
    retninger: modell.retninger,
    fraTidspunkt: tidspunkt(fra, fraKlokke),
    bilDager,
  })
  if (!turer.length) return tom('Ingen reisedager i perioden.')

  const opsjoner = {
    prisDato: ISO.test(modell.prisDato ?? '') ? modell.prisDato : fra,
    prisokning: modell.prisokning,
    inkluderAarskort: modell.inkluderAarskort,
  }
  const { beste, alternativer } = sammenlignAlternativer(turer, strekninger, opsjoner)
  if (!beste.mulig) {
    return tom('Turene lar seg ikke dekke. Legg inn enkeltpris eller velg flere bildager.')
  }
  const harAarskort = strekninger.some((s) => s.perioder.some((p) => p.dager >= 365))
  return {
    feil: null,
    resultat: beste,
    alternativer: alternativer.filter((a) => a.resultat.mulig),
    aarskort: harAarskort ? aarskortAnalyse(turer, strekninger, opsjoner) : null,
    varsler: sommertidVarsler(beste.billetter),
    oppsummering: {
      kalenderdager: kalender.length,
      reisedager: dager.length,
      turer: turer.length,
      frieDager: kalender.filter((d) => ['helligdag', 'fri', 'ferie'].includes(d.type)).length,
    },
  }
}
