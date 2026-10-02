import { MIN_DOEGN, formaterTidspunkt } from './dato.js'
import { prisPaaDato, STANDARD_PRISOKNING } from './priser.js'

const AARSKORT_DAGER = 365
const MARGIN_PASS_PAA_MIN = 120

const tillatt = (tur, strekning) => !strekning.bil || tur.bil

// Dynamisk programmering bakfra: f[i] = billigste dekning av tur i og alle etter.
// Tur i er alltid første udekte tur, og en billett aktiveres ved den (fornyelse
// skjer ved avreise, ikke ved utløp). En tur er dekket hvis den starter senest
// ved utløp. Et kort på en bil-strekning dekker bare sammenhengende bil-dager;
// en tur uten bil bryter dekningen selv om kortet fortsatt er gyldig.
export function optimaliser(turer, strekninger, opsjoner = {}) {
  const {
    prisDato = turer.length ? turer[0].dato : '1970-01-01',
    prisokning = STANDARD_PRISOKNING,
    tillatEnkelt = true,
    inkluderAarskort = true,
    kunDager = null,
  } = opsjoner
  const n = turer.length
  const f = new Array(n + 1).fill(Infinity)
  const valg = new Array(n)
  f[n] = 0

  const pris = (grunn, tur) => prisPaaDato(grunn, prisDato, tur.dato, prisokning)

  for (let i = n - 1; i >= 0; i--) {
    const tur = turer[i]

    if (tillatEnkelt) {
      for (const s of strekninger) {
        if (!tillatt(tur, s)) continue
        const kost = pris(s.enkelt, tur) + f[i + 1]
        if (kost < f[i]) {
          f[i] = kost
          valg[i] = { type: 'enkelt', strekning: s, pris: pris(s.enkelt, tur), neste: i + 1 }
        }
      }
    }

    const perioder = strekninger
      .flatMap((s) => s.perioder.map((p) => ({ s, p })))
      .filter(({ p }) => inkluderAarskort || p.dager < AARSKORT_DAGER)
      .filter(({ p }) => !kunDager || kunDager.includes(p.dager))
      .sort((a, b) => a.p.dager - b.p.dager)

    for (const { s, p } of perioder) {
      if (!tillatt(tur, s)) continue
      const utloper = tur.tid + p.dager * MIN_DOEGN
      let j = i + 1
      while (j < n && turer[j].tid <= utloper && tillatt(turer[j], s)) j++
      const billettpris = pris(p.pris, tur)
      const kost = billettpris + f[j]
      if (kost < f[i]) {
        f[i] = kost
        valg[i] = { type: 'periode', strekning: s, dager: p.dager, pris: billettpris, utloper, neste: j }
      }
    }
  }

  if (!Number.isFinite(f[0]) && n > 0) return { mulig: false, kostnad: null, billetter: [], udekteDager: [] }

  const billetter = []
  const enkeltPerDag = new Map()
  for (let i = 0; i < n; i = valg[i].neste) {
    const v = valg[i]
    if (v.type === 'enkelt') {
      const dag = enkeltPerDag.get(turer[i].dato) ?? { dato: turer[i].dato, antallTurer: 0, kostnad: 0 }
      dag.antallTurer++
      dag.kostnad += v.pris
      enkeltPerDag.set(dag.dato, dag)
      continue
    }
    const dekket = turer.slice(i, v.neste)
    const siste = dekket[dekket.length - 1]
    const margin = v.utloper - siste.tid
    billetter.push({
      strekningId: v.strekning.id,
      strekningNavn: v.strekning.navn,
      dager: v.dager,
      pris: v.pris,
      aktivering: formaterTidspunkt(turer[i].tid),
      utloper: formaterTidspunkt(v.utloper),
      foersteTur: { dato: turer[i].dato, retning: turer[i].retning },
      sisteTur: { dato: siste.dato, retning: siste.retning, tid: formaterTidspunkt(siste.tid) },
      antallTurer: dekket.length,
      marginMin: margin,
      passPaa: margin <= MARGIN_PASS_PAA_MIN,
      bindende: v.dager >= AARSKORT_DAGER,
    })
  }

  return {
    mulig: true,
    kostnad: n === 0 ? 0 : f[0],
    billetter,
    udekteDager: [...enkeltPerDag.values()],
  }
}

// Enkle alternativer å måle den optimale kjeden mot. Hver bruker én billettype
// uten enkeltbilletter, så «tre månedskort» er akkurat det.
export function sammenlignAlternativer(turer, strekninger, opsjoner = {}) {
  const beste = optimaliser(turer, strekninger, opsjoner)
  const typer = [
    ...new Set(strekninger.flatMap((s) => s.perioder.map((p) => p.dager))),
  ].sort((a, b) => a - b)
  const alternativer = [
    { navn: 'Bare enkeltbilletter', resultat: optimaliser(turer, strekninger, { ...opsjoner, kunDager: [] }) },
    ...typer
      .filter((d) => opsjoner.inkluderAarskort !== false || d < AARSKORT_DAGER)
      .map((dager) => ({
        navn: `Bare ${dager}-dagersbilletter`,
        resultat: optimaliser(turer, strekninger, { ...opsjoner, kunDager: [dager], tillatEnkelt: false }),
      })),
  ].map((a) => ({
    ...a,
    differanse: a.resultat.mulig && beste.mulig ? a.resultat.kostnad - beste.kostnad : null,
  }))
  return { beste, alternativer }
}

// Årskort mot beste kjede uten årskort over de samme turene (typisk 365 dager).
export function aarskortAnalyse(turer, strekninger, opsjoner = {}) {
  const med = optimaliser(turer, strekninger, { ...opsjoner, inkluderAarskort: true })
  const uten = optimaliser(turer, strekninger, { ...opsjoner, inkluderAarskort: false })
  const brukerAarskort = med.billetter.some((b) => b.dager >= AARSKORT_DAGER)
  return {
    medAarskort: med,
    utenAarskort: uten,
    lonnerSeg: brukerAarskort,
    besparelse: med.mulig && uten.mulig ? uten.kostnad - med.kostnad : null,
  }
}
