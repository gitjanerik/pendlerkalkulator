import { z } from 'zod'
import { beregn, standardModell } from '../src/lib/modell.js'
import { norskeHelligdager, paaskeukeMandagOnsdag } from '../src/lib/helligdager.js'
import { parseIcs, slaaSammenFerie } from '../src/lib/ics.js'
import { PRESETS, PRESET_DATO, strekningFraPreset } from '../src/lib/presets.js'
import { norskDato } from '../src/lib/format.js'

const dato = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Bruk ÅÅÅÅ-MM-DD')
const klokke = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Bruk TT:MM')

const strekning = z.object({
  navn: z.string(),
  bil: z.boolean().default(false).describe('Bare brukbar på bildager'),
  enkelt: z.number().positive().nullish().describe('Enkeltbillett, kr'),
  perioder: z
    .array(z.object({ dager: z.number().int().positive(), pris: z.number().positive() }))
    .default([])
    .describe('Periodebilletter, f.eks. {dager: 30, pris: 2038}'),
})

export const beregnSkjema = {
  fra: dato,
  til: dato,
  strekninger: z.array(strekning).min(1),
  fraKlokke: klokke.optional().describe('Første reise samme dag, standard 00:00'),
  morgen: klokke.optional(),
  ettermiddag: klokke.optional(),
  retninger: z.enum(['begge', 'morgen', 'ettermiddag']).optional(),
  ferie: z.array(z.object({ fra: dato, til: dato })).optional(),
  bilUkedager: z.array(z.number().int().min(0).max(6)).optional().describe('0 = mandag'),
  jobbUkedager: z.array(z.number().int().min(0).max(4)).min(1).optional().describe('Dager på jobb, 0 = mandag. Resten regnes som hjemmekontor'),
  jobberPaaskeMandagOnsdag: z.boolean().optional(),
  jobberRomjul: z.boolean().optional(),
  inkluderAarskort: z.boolean().optional(),
  sisteFullPris: z.boolean().optional().describe('Siste billett i full pris (standard). Falsk regner den forholdsmessig mot sluttdatoen'),
  reis: z.boolean().optional().describe('Ruter Reis: rabatt på enkeltbilletter etter antall reiser siste 30 dager'),
  prisDato: dato.optional().describe('Dato prisene gjelder fra, standard = fra'),
}

export function beregnBilletter(inn) {
  const m = standardModell(inn.fra)
  m.til = inn.til
  m.strekninger = inn.strekninger.map((s, i) => ({
    id: `s${i}`,
    navn: s.navn,
    bil: s.bil,
    enkelt: s.enkelt ?? '',
    perioder: s.perioder,
  }))
  for (const k of ['fraKlokke', 'morgen', 'ettermiddag', 'retninger', 'ferie', 'bilUkedager', 'jobbUkedager', 'reis', 'inkluderAarskort', 'sisteFullPris', 'prisDato']) {
    if (inn[k] !== undefined) m[k] = inn[k]
  }
  if (inn.jobberPaaskeMandagOnsdag !== undefined) m.innstillinger.jobberPaaskeMandagOnsdag = inn.jobberPaaskeMandagOnsdag
  if (inn.jobberRomjul !== undefined) m.innstillinger.jobberRomjul = inn.jobberRomjul
  const r = beregn(m)
  if (r.feil) return { feil: r.feil }
  return {
    kostnad: Math.round(r.resultat.kostnad),
    billetter: r.resultat.billetter,
    enkeltbilletter: r.resultat.udekteDager,
    alternativer: r.alternativer.map((a) => ({ navn: a.navn, kostnad: Math.round(a.resultat.kostnad), merkostnad: Math.round(a.differanse) })),
    aarskort: r.aarskort && {
      lonnerSeg: r.aarskort.lonnerSeg,
      besparelse: r.aarskort.besparelse,
    },
    oppsummering: r.oppsummering,
  }
}

export const forslag = () => ({
  gjelderFra: PRESET_DATO,
  merknad: 'Vys voksenpriser til Oslo S. Enkeltpris er null der den ikke er lest av.',
  strekninger: PRESETS.map((p) => {
    const s = strekningFraPreset(p, p.id)
    return {
      id: p.id,
      navn: s.navn,
      enkelt: p.enkelt,
      perioder: s.perioder,
    }
  }),
})

export function helligdager({ aar }) {
  return {
    fridager: Object.entries(norskeHelligdager(aar))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([d, navn]) => ({ dato: d, navn })),
    paaskeukeMandagOnsdag: paaskeukeMandagOnsdag(aar),
  }
}

export function lesIcs({ tekst }) {
  const { hendelser, gjentakende } = parseIcs(tekst)
  const heldag = hendelser.filter((h) => h.heldag)
  return {
    ferie: slaaSammenFerie(heldag.map((h) => ({ fra: h.fra, til: h.til }))),
    hendelser: hendelser.map((h) => ({ ...h, beskrivelse: `${norskDato(h.fra, true)}–${norskDato(h.til, true)}` })),
    gjentakendeIgnorert: gjentakende,
  }
}
