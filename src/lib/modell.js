import { byggKalender, reisedager, STANDARD_INNSTILLINGER } from './kalender.js'
import { byggTurer } from './turer.js'
import { datoerMellom, leggTilDager, tidspunkt, ukedag } from './dato.js'
import { tilEtterMaaneder } from './periode.js'
import { MONSTER } from './dagmonster.js'
import { PRESETS, strekningFraPreset } from './presets.js'
import { aarskortAnalyse, sammenlignAlternativer } from './optimerer.js'
import { byggFritidsturer, flyplassForhold, fritidTillegg, medFritidspriser } from './fritid.js'
import { maalnavn } from './stasjoner.js'
import { STANDARD_PRISOKNING, antallPrisokninger, prisPaaDato } from './priser.js'

const ISO = /^\d{4}-\d{2}-\d{2}$/
const KLOKKE = /^([01]\d|2[0-3]):[0-5]\d$/
const MAKS_DAGER = 365 * 3
// Ett år som standard, så en lang sommerferie alltid er med.
const STANDARD_MND = 12

// Startverdiene er Gulskogen–Oslo S med Vys priser høsten 2026.
export function standardModell(idag) {
  return {
    versjon: 2,
    fra: idag,
    // Tom streng betyr «nå» (første dag) – appen setter klokkeslettet selv.
    fraKlokke: '',
    til: tilEtterMaaneder(idag, STANDARD_MND),
    // Faktiske avgangstider fra stasjonen og fra Oslo S.
    morgen: '07:00',
    ettermiddag: '16:00',
    retninger: 'begge',
    innstillinger: { ...STANDARD_INNSTILLINGER },
    ferie: [],
    // Fritidsreiser til Oslo lufthavn: [{ fra: dato ned, til: dato hjem }]
    fritidsreiser: [],
    // Hjemstasjoner brukeren har lagt til selv, samme form som en strekning.
    egneStasjoner: [],
    jobbUkedager: [...MONSTER[5]],
    bilUkedager: [0, 1, 2, 3, 4],
    prisokning: { ...STANDARD_PRISOKNING },
    prisDato: idag,
    inkluderAarskort: false,
    reis: false,
    // Periodebillett brukeren allerede har: beregningen starter når den utløper.
    eksisterende: { paa: false, type: 'maaned', til: '', klokke: '07:00' },
    oppsettFerdig: false,
    // Infoboksen etter veiviseren: vises først når veiviseren fullføres, og bare til den lukkes.
    infoLukket: true,
    strekninger: [strekningFraPreset(PRESETS[0], PRESETS[0].id)],
  }
}

const lufthavnPris = (s) => {
  const pris = Number(s.lufthavn ?? PRESETS.find((p) => p.id === s.id)?.lufthavn)
  return pris > 0 ? pris : null
}

export function normaliserStrekninger(strekninger) {
  return strekninger
    .map((s) => ({
      id: s.id,
      navn: String(s.navn ?? '').trim() || 'Uten navn',
      bil: Boolean(s.bil),
      ruter: Boolean(s.ruter),
      enkelt: Number(s.enkelt) > 0 ? Number(s.enkelt) : Infinity,
      // Lagrede strekninger fra før feltet fantes henter prisen fra forhåndsvalget med samme id.
      lufthavn: lufthavnPris(s),
      flyplass: ['bak', 'foer', 'utenfor'].includes(s.flyplass) ? s.flyplass : s.bakOsloS === false ? 'foer' : null,
      tillegg: Number(s.tillegg) > 0 ? Number(s.tillegg) : '',
      tilEnturId: s.tilEnturId ?? '',
      perioder: s.perioder
        .map((p) => ({ dager: Number(p.dager), pris: Number(p.pris) }))
        .filter((p) => Number.isInteger(p.dager) && p.dager > 0 && p.pris > 0),
    }))
    .filter((s) => s.enkelt !== Infinity || s.perioder.length)
}

const tom = (feil) => ({ feil, resultat: null })

// Ren funksjon fra skjemaets tilstand til alt UI-et viser.
export function beregn(modell) {
  const { fra, til } = modell
  const fraKlokke = modell.fraKlokke || '00:00'
  if (!ISO.test(fra ?? '') || !ISO.test(til ?? '')) return tom('Velg start- og sluttdato.')
  if (til < fra) return tom('Sluttdatoen er før startdatoen.')
  if (!KLOKKE.test(fraKlokke ?? '')) return tom('Startklokkeslettet er ugyldig.')
  if (!KLOKKE.test(modell.morgen) || !KLOKKE.test(modell.ettermiddag)) {
    return tom('Avgangstidene er ugyldige.')
  }
  const strekninger = normaliserStrekninger(modell.strekninger)
  if (!strekninger.length) return tom('Legg inn pris for minst én strekning.')

  const ferie = modell.ferie.filter((f) => ISO.test(f.fra) && ISO.test(f.til) && f.til >= f.fra)
  const jobbDager = new Set(modell.jobbUkedager ?? MONSTER[5])
  if (!jobbDager.size) return tom('Velg minst én jobbdag i uka.')
  const hjemmekontor = datoerMellom(fra, til).filter((d) => ukedag(d) < 5 && !jobbDager.has(ukedag(d)))
  const kalender = byggKalender({
    fra,
    til,
    innstillinger: modell.innstillinger,
    ferie,
    hjemmekontor,
  })
  if (kalender.length > MAKS_DAGER) return tom(`Velg en periode på høyst ${MAKS_DAGER} dager.`)

  const dager = reisedager(kalender)
  const vinduSlutt = tidspunkt(leggTilDager(til, 1), '00:00')
  const eks = modell.eksisterende
  const eksUtloep =
    eks?.paa && ISO.test(eks.til ?? '') && KLOKKE.test(eks.klokke ?? '') ? tidspunkt(eks.til, eks.klokke) : null
  const bilUkedager = new Set(modell.bilUkedager)
  const bilDager = new Set(dager.filter((d) => bilUkedager.has(ukedag(d.dato))).map((d) => d.dato))
  const fraTidspunkt = Math.max(tidspunkt(fra, fraKlokke), eksUtloep ?? -Infinity)
  const jobbTurer = byggTurer(dager, {
    morgen: modell.morgen,
    ettermiddag: modell.ettermiddag,
    retninger: modell.retninger,
    fraTidspunkt,
    bilDager,
  })
  const fritidsturer = byggFritidsturer(
    (modell.fritidsreiser ?? []).filter((r) => ISO.test(r.fra) && ISO.test(r.til) && r.til >= r.fra),
    { fra, til, fraKlokke, morgen: modell.morgen, ettermiddag: modell.ettermiddag, bilUkedager },
  )
  // Reiser mens den eksisterende billetten gjelder er dekket og koster bare tillegget.
  const fritidMedPris = medFritidspriser(fritidsturer, strekninger[0])
  const turer = [...jobbTurer, ...fritidMedPris.filter((t) => t.tid >= fraTidspunkt)].sort((a, b) => a.tid - b.tid)
  if (!turer.length) {
    return tom(eksUtloep === null ? 'Ingen reisedager i perioden.' : 'Periodebilletten din dekker hele perioden.')
  }

  const prisDato = ISO.test(modell.prisDato ?? '') ? modell.prisDato : fra
  const opsjoner = {
    prisDato,
    prisokning: modell.prisokning,
    inkluderAarskort: modell.inkluderAarskort,
    reis: Boolean(modell.reis),
    vinduSlutt,
  }
  const { beste, alternativer } = sammenlignAlternativer(turer, strekninger, opsjoner)
  if (!beste.mulig) {
    return tom('Turene lar seg ikke dekke. Legg inn enkeltpris eller velg flere bildager.')
  }
  const tidligTillegg = (t) => ({
    dato: t.dato,
    retning: t.retning,
    tid: t.tid,
    dekning: 'eksisterende',
    pris: prisPaaDato(flyplassForhold(strekninger[0]) === 'utenfor' ? t.tilleggGrunn : fritidTillegg(strekninger[0]), prisDato, t.dato, modell.prisokning),
    estimert: Boolean(modell.prisokning?.paa) && antallPrisokninger(prisDato, t.dato, modell.prisokning) > 0,
  })
  const tidlige = fritidMedPris.filter((t) => t.tid < fraTidspunkt).map(tidligTillegg)
  const fritidReiser = [...beste.fritid, ...tidlige].sort((a, b) => a.tid - b.tid)
  const fritidSum = fritidReiser.reduce((sum, r) => sum + r.pris, 0)
  beste.kostnad += tidlige.reduce((sum, r) => sum + r.pris, 0)
  if (fritidReiser.some((r) => r.estimert)) beste.estimert = true
  const harAarskort = strekninger.some((s) => s.perioder.some((p) => p.dager >= 365))
  return {
    feil: null,
    resultat: beste,
    alternativer: alternativer.filter((a) => a.resultat.mulig),
    aarskort: harAarskort ? aarskortAnalyse(turer, strekninger, opsjoner) : null,
    fritid: fritidReiser.length
      ? { sum: fritidSum, forhold: flyplassForhold(strekninger[0]), maal: maalnavn(strekninger[0]), estimert: fritidReiser.some((r) => r.estimert), reiser: fritidReiser }
      : null,
    kalender,
    tidsramme: { morgen: modell.morgen, ettermiddag: modell.ettermiddag, retninger: modell.retninger },
    prisokningProsent: modell.prisokning?.paa ? Number(modell.prisokning.prosent) : null,
    perMaaned: Math.round((beste.kostnad / kalender.length) * 30.44),
    oppsummering: {
      kalenderdager: kalender.length,
      reisedager: dager.length,
      turer: turer.length,
      frieDager: kalender.filter((d) => ['helligdag', 'fri', 'ferie'].includes(d.type)).length,
    },
  }
}

// Kostnad for hvert av de fem typiske ukemønstrene (1–5 jobbdager), til grafen
// som viser hva hjemmekontor er verdt.
export function monsterAnalyse(modell) {
  return Object.entries(MONSTER).map(([antall, dager]) => {
    const r = beregn({ ...modell, jobbUkedager: dager })
    return {
      antall: Number(antall),
      kostnad: r.feil ? null : r.resultat.kostnad,
      perMaaned: r.feil ? null : r.perMaaned,
      estimert: r.feil ? false : r.resultat.estimert,
    }
  })
}
