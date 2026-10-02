import { MIN_DOEGN, formaterTidspunkt } from './dato.js'
import { prisPaaDato, STANDARD_PRISOKNING } from './priser.js'
import { anvendReis } from './reis.js'

const AARSKORT_DAGER = 365
const MARGIN_PASS_PAA_MIN = 120

const tillatt = (tur, strekning) => !strekning.bil || tur.bil

// Dynamisk programmering bakfra: f[i] = billigste dekning av tur i og alle etter.
// Tur i er alltid første udekte tur, og en billett aktiveres ved den (fornyelse
// skjer ved avreise, ikke ved utløp). En tur er dekket hvis den starter senest
// ved utløp. Et kort på en bil-strekning dekker bare sammenhengende bil-dager;
// en tur uten bil bryter dekningen selv om kortet fortsatt er gyldig.
function optimaliserKjerne(turer, strekninger, opsjoner = {}) {
  const {
    enkeltFaktor = 1,
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
        const kost = pris(s.enkelt, tur) * enkeltFaktor + f[i + 1]
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
  const enkeltReiser = []
  for (let i = 0; i < n; i = valg[i].neste) {
    const v = valg[i]
    if (v.type === 'enkelt') {
      const dag = enkeltPerDag.get(turer[i].dato) ?? { dato: turer[i].dato, antallTurer: 0, kostnad: 0 }
      dag.antallTurer++
      dag.kostnad += v.pris
      enkeltPerDag.set(dag.dato, dag)
      enkeltReiser.push({ tid: turer[i].tid, dato: turer[i].dato, pris: v.pris })
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
    kostnad: billetter.reduce((sum, b) => sum + b.pris, 0) + enkeltReiser.reduce((sum, r) => sum + r.pris, 0),
    billetter,
    udekteDager: [...enkeltPerDag.values()],
    enkeltReiser,
  }
}

// Reis-rabatten avhenger av hvor mange enkeltreiser som ligger i de siste 30
// dagene, altså av selve planen. Derfor prøves planer laget med ulike
// forutsatte rabattnivåer, og hver prises eksakt med glidende vindu; billigste vinner.
const REIS_NIVAAER = [1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6]

function prisMedReis(plan) {
  if (!plan.mulig || !plan.enkeltReiser.length) return { ...plan, reis: null }
  const reiser = anvendReis(plan.enkeltReiser)
  const perDag = new Map()
  for (const r of reiser) {
    const dag = perDag.get(r.dato) ?? { dato: r.dato, antallTurer: 0, kostnad: 0 }
    dag.antallTurer++
    dag.kostnad += r.netto
    perDag.set(r.dato, dag)
  }
  const foer = reiser.reduce((sum, r) => sum + r.pris, 0)
  const etter = reiser.reduce((sum, r) => sum + r.netto, 0)
  return {
    ...plan,
    kostnad: plan.kostnad - foer + etter,
    udekteDager: [...perDag.values()],
    reis: {
      enkeltreiser: reiser.length,
      rabatterte: reiser.filter((r) => r.prosent > 0).length,
      maksProsent: Math.max(...reiser.map((r) => r.prosent)),
      besparelse: foer - etter,
    },
  }
}

// Med opsjonen `reis` får enkeltbilletter Ruter Reis-rabatt (se reis.js).
export function optimaliser(turer, strekninger, opsjoner = {}) {
  const { reis, ...rest } = opsjoner
  if (!reis) return { ...optimaliserKjerne(turer, strekninger, rest), reis: null }
  let beste = null
  for (const enkeltFaktor of REIS_NIVAAER) {
    const plan = prisMedReis(optimaliserKjerne(turer, strekninger, { ...rest, enkeltFaktor }))
    if (plan.mulig && (!beste || plan.kostnad < beste.kostnad)) beste = plan
  }
  return beste ?? { ...optimaliserKjerne(turer, strekninger, rest), reis: null }
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
