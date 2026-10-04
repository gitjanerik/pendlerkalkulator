<script setup>
import { computed, ref } from 'vue'
import { dagNr, isoFraDagNr, ukedag } from '../lib/dato.js'
import { kr, norskTidspunkt, norskDato, norskDatoLang, dagerTekst, MAANED_NAVN, UKEDAG_NAVN, UKEDAG_LANGE } from '../lib/format.js'
import { isoUke, utnyttelse } from '../lib/billetter.js'
import Estimat from './Estimat.vue'

const p = defineProps({ utfall: Object })
const valgt = ref(null)
const visning = ref('tidslinje')
const VISNINGER = [
  { id: 'tidslinje', navn: 'Tidslinje', ikon: 'M3 7h9M3 12h18M3 17h13' },
  { id: 'kalender', navn: 'Kalender', ikon: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4' },
  { id: 'tabell', navn: 'Tabell', ikon: 'M4 5h16v14H4zM4 10h16M4 15h16M10 5v14' },
]

const MND = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des']
// Fyllet følger billettlengde: lengre billett, mørkere flate. Kanten er alltid full aksentfarge,
// så billetten skilles fra bakgrunnen (3:1) uansett fyll.
const ADVARSEL_PROSENT = 90
const FYLL = { 7: 25, 30: 55 }
const fyll = (d) => `color-mix(in srgb, var(--color-accent) ${FYLL[d] ?? 100}%, transparent)`

const fritid = computed(() => p.utfall.fritid?.reiser ?? [])
const grunnlag = computed(() => {
  const r = p.utfall.resultat
  const start = Math.min(
    ...r.billetter.map((b) => dagNr(b.aktivering.slice(0, 10))),
    ...r.udekteDager.map((d) => dagNr(d.dato)),
    ...fritid.value.map((f) => dagNr(f.dato)),
  )
  const slutt = Math.max(
    ...r.billetter.map((b) => dagNr(b.sisteTur.dato)),
    ...r.udekteDager.map((d) => dagNr(d.dato)),
    ...fritid.value.map((f) => dagNr(f.dato)),
  )
  return { start, spenn: Math.max(slutt - start + 1, 1) }
})
const pct = (nr) => ((nr - grunnlag.value.start) / grunnlag.value.spenn) * 100

const segmenter = computed(() =>
  p.utfall.resultat.billetter.map((b, i) => {
    const a = dagNr(b.aktivering.slice(0, 10))
    const s = dagNr(b.sisteTur.dato)
    return { ...b, i, left: pct(a), width: Math.max(((s - a + 1) / grunnlag.value.spenn) * 100, 1.2) }
  }),
)
const enkelt = computed(() =>
  p.utfall.resultat.udekteDager.map((d) => ({ ...d, left: pct(dagNr(d.dato)) })),
)
const fritidMerker = computed(() => fritid.value.map((f) => ({ ...f, left: pct(dagNr(f.dato)) })))
const maaneder = computed(() => {
  const { start, spenn } = grunnlag.value
  const ut = []
  for (let nr = start; nr < start + spenn; nr++) {
    const iso = isoFraDagNr(nr)
    if (iso.endsWith('-01') || nr === start) ut.push({ left: pct(nr), tekst: MND[Number(iso.slice(5, 7)) - 1] })
  }
  const steg = Math.ceil(ut.length / 6)
  return ut.filter((_, i) => i % steg === 0)
})
const brukte = computed(() => [...new Set(p.utfall.resultat.billetter.map((b) => b.dager))].sort((a, b) => a - b))
const detalj = computed(() => segmenter.value.find((s) => s.i === valgt.value))
const velg = (i) => (valgt.value = valgt.value === i ? null : i)

const dagTekst = (iso) => norskDato(iso)
const tidTekst = (tekst) => tekst.split('T')[1]
// Med to strekninger gjelder hver billett bare sine ukedager, og utnyttelsen måles mot dem.
const ukedagerFor = (b) => {
  const r = p.utfall.flereRuter
  if (!r) return undefined
  const ekstra = r.ekstraDager
  return b.strekningId === r.ekstra ? ekstra : [0, 1, 2, 3, 4].filter((d) => !ekstra.includes(d))
}
const rader = computed(() =>
  segmenter.value.map((b) => {
    const fra = b.aktivering.slice(0, 10)
    const til = b.utloper.slice(0, 10)
    return {
      ...b,
      ukeFra: isoUke(fra),
      ukeRest: isoUke(fra) === isoUke(til) ? '' : `–${isoUke(til)}${fra.slice(0, 4) === til.slice(0, 4) ? '' : ` ’${til.slice(2, 4)}`}`,
      fra,
      til,
      klokkeFra: tidTekst(b.aktivering),
      klokkeTil: tidTekst(b.utloper),
      prosent: Math.round(utnyttelse(b, p.utfall.tidsramme, ukedagerFor(b)) * 100),
    }
  }),
)
const sum = computed(() => ({
  pris: rader.value.reduce((t, r) => t + r.pris, 0),
  turer: rader.value.reduce((t, r) => t + r.antallTurer, 0),
  estimert: rader.value.some((r) => r.estimert),
}))

// Kalendervisning: én måned om gangen, fargelagt etter billetten som dekker dagen.
const dagTilBillett = computed(() => {
  const kart = new Map()
  for (const s of segmenter.value) {
    const dager = ukedagerFor(s)
    for (let nr = dagNr(s.aktivering.slice(0, 10)); nr <= dagNr(s.sisteTur.dato); nr++) {
      // Med to strekninger farges bare ukedagene billetten gjelder (helgene farges som før).
      const ukedag_ = ukedag(isoFraDagNr(nr))
      if (!dager || ukedag_ >= 5 || dager.includes(ukedag_)) kart.set(nr, s.i)
    }
  }
  return kart
})
const enkeltDatoer = computed(() => new Set(p.utfall.resultat.udekteDager.map((d) => d.dato)))
const dagType = computed(() => new Map(p.utfall.kalender.map((d) => [d.dato, d])))
const forsteMaaned = computed(() => isoFraDagNr(grunnlag.value.start).slice(0, 7))
const sisteMaaned = computed(() => isoFraDagNr(grunnlag.value.start + grunnlag.value.spenn - 1).slice(0, 7))
const maaned = ref(null)
const aktivMaaned = computed(() => {
  const m = maaned.value ?? forsteMaaned.value
  return m < forsteMaaned.value ? forsteMaaned.value : m > sisteMaaned.value ? sisteMaaned.value : m
})
const flyttMaaned = (n) => {
  const [aar, mnd] = aktivMaaned.value.split('-').map(Number)
  const d = new Date(Date.UTC(aar, mnd - 1 + n, 1))
  maaned.value = d.toISOString().slice(0, 7)
}
const billettNavn = (d) => (d >= 365 ? 'årskort' : `${d}-dagersbillett`)
const SKYGGE_FLATE = { 7: 22, 30: 38 }  // resten 50: ink-tekst holder 4,5:1 på alle tre, i begge temaer
const IKKE_ARBEID = { helligdag: 'helligdag', fri: 'fri', ferie: 'ferie', hjemmekontor: 'hjemmekontor' }
const maanedsTittel = computed(() => {
  const [aar, mnd] = aktivMaaned.value.split('-').map(Number)
  return `${MAANED_NAVN[mnd - 1]} ${aar}`
})
const uker = computed(() => {
  const [aar, mnd] = aktivMaaned.value.split('-').map(Number)
  const forste = `${aktivMaaned.value}-01`
  const antall = new Date(Date.UTC(aar, mnd, 0)).getUTCDate()
  const celler = [...Array(ukedag(forste)).fill(null)]
  for (let d = 1; d <= antall; d++) {
    const iso = `${aktivMaaned.value}-${String(d).padStart(2, '0')}`
    const i = dagTilBillett.value.get(dagNr(iso))
    const b = i === undefined ? null : segmenter.value[i]
    const type = dagType.value.get(iso)?.type
    celler.push({
      iso,
      dag: d,
      billett: i ?? null,
      start: b ? b.aktivering.startsWith(iso) : false,
      enkelt: enkeltDatoer.value.has(iso),
      helg: ukedag(iso) >= 5,
      merke: IKKE_ARBEID[type] ?? null,
      flate: b ? (SKYGGE_FLATE[b.dager] ?? 50) : 0,
      tekst: [norskDatoLang(iso), b ? billettNavn(b.dager) + (p.utfall.flereRuter ? ` ${b.strekningNavn}` : '') : null, enkeltDatoer.value.has(iso) ? 'enkeltbillett' : null, IKKE_ARBEID[type] ?? null].filter(Boolean).join(', '),
    })
  }
  const ut = []
  for (let i = 0; i < celler.length; i += 7) {
    const rad = celler.slice(i, i + 7)
    while (rad.length < 7) rad.push(null)
    ut.push({ uke: isoUke(rad.find(Boolean).iso), celler: rad })
  }
  return ut
})
</script>

<template>
  <section class="kort" aria-labelledby="bt-tittel">
    <h2 id="bt-tittel" class="seksjonstittel">Billettene dine</h2>
    <div class="mt-3 flex flex-wrap gap-1 rounded-xl border border-[var(--color-edge)] p-0.5" role="group" aria-label="Visning">
      <button v-for="v in VISNINGER" :key="v.id" type="button" class="visning" :aria-pressed="visning === v.id" @click="visning = v.id">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="hidden sm:block" aria-hidden="true"><path :d="v.ikon" /></svg>
        {{ v.navn }}
      </button>
    </div>

    <template v-if="visning === 'tidslinje'">
      <div class="relative mt-4" :class="utfall.flereRuter ? 'h-[7.25rem]' : 'h-20'" role="group" aria-label="Billetter langs tidsaksen">
        <div class="absolute inset-x-0 top-3.5 h-px bg-[var(--color-line)]"></div>
        <div v-if="utfall.flereRuter" class="absolute inset-x-0 top-[3.125rem] h-px bg-[var(--color-line)]"></div>
        <button
          v-for="s in segmenter"
          :key="s.i"
          type="button"
          class="segment absolute h-7 rounded-sm border-2 border-[var(--color-accent)]"
          :class="[{ valgt: valgt === s.i }, utfall.flereRuter && s.strekningId === utfall.flereRuter.ekstra ? 'top-9' : 'top-0']"
          :style="{ left: s.left + '%', width: s.width + '%', background: fyll(s.dager) }"
          :aria-label="`${dagerTekst(s.dager)}${utfall.flereRuter ? ` ${s.strekningNavn}` : ''}, ${kr(s.pris)}${s.estimert ? ' (estimert)' : ''}, aktiveres ${norskDatoLang(s.aktivering.slice(0, 10))}`"
          :aria-pressed="valgt === s.i"
          @click="velg(s.i)"
        ></button>
        <span
          v-for="d in enkelt"
          :key="d.dato"
          class="absolute h-2 w-0.5 bg-[var(--color-warn)]"
          :class="utfall.flereRuter ? 'top-[4.5rem]' : 'top-8'"
          :style="{ left: d.left + '%' }"
          :title="`${norskDato(d.dato)}: enkeltbillett ${kr(d.kostnad)}`"
          aria-hidden="true"
        ></span>
        <span
          v-for="f in fritidMerker"
          :key="f.tid + f.retning"
          class="absolute h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-[var(--color-ink)]"
          :class="utfall.flereRuter ? 'top-[5.25rem]' : 'top-11'"
          :style="{ left: Math.min(Math.max(f.left, 1), 99) + '%' }"
          :title="`${norskDato(f.dato)}: fritidsreise til Oslo lufthavn`"
          aria-hidden="true"
        ></span>
        <span
          v-for="mnd in maaneder"
          :key="mnd.left"
          class="absolute bottom-0 -translate-x-1/2 text-sm text-[var(--color-ink-3)]"
          :style="{ left: Math.min(Math.max(mnd.left, 3), 97) + '%' }"
          aria-hidden="true"
          >{{ mnd.tekst }}</span
        >
      </div>
      <p class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-ink-2)]">
        <span v-for="d in brukte" :key="d"><i class="mr-1.5 inline-block h-3 w-4 rounded-sm border-2 border-[var(--color-accent)] align-middle" :style="{ background: fyll(d) }"></i>{{ dagerTekst(d) }}</span>
        <span v-if="fritid.length"><i class="mr-1.5 inline-block h-2 w-2 rotate-45 bg-[var(--color-ink)] align-middle"></i>fritidsreise</span>
        <span v-if="enkelt.length"><i class="mr-1.5 inline-block h-3 w-0.5 bg-[var(--color-warn)] align-middle"></i>enkeltbillett</span>
      </p>
    </template>

    <template v-else-if="visning === 'kalender'">
      <div class="mt-4 flex flex-wrap items-center justify-between gap-2">
        <button type="button" class="chip px-0" aria-label="Forrige måned" :aria-disabled="aktivMaaned <= forsteMaaned" @click="aktivMaaned > forsteMaaned && flyttMaaned(-1)">‹</button>
        <p id="bt-mnd" class="font-semibold capitalize" aria-live="polite">{{ maanedsTittel }}</p>
        <button type="button" class="chip px-0" aria-label="Neste måned" :aria-disabled="aktivMaaned >= sisteMaaned" @click="aktivMaaned < sisteMaaned && flyttMaaned(1)">›</button>
      </div>
      <!-- Ved stor skrift får kalenderen rulle sideveis i kortet i stedet for å sprenge siden. -->
      <div class="overflow-x-auto">
      <div role="table" aria-labelledby="bt-mnd" class="min-w-[13rem]">
        <div role="row" class="mt-3 grid grid-cols-[1.75rem_repeat(7,minmax(0,1fr))] gap-1 text-center text-sm text-[var(--color-ink-3)]">
          <span role="columnheader" aria-label="uke">uke</span>
          <span v-for="(d, i) in UKEDAG_NAVN" :key="d" role="columnheader" :aria-label="UKEDAG_LANGE[i]">{{ d }}</span>
        </div>
        <div v-for="u in uker" :key="u.uke" role="row" class="mt-1 grid grid-cols-[1.75rem_repeat(7,minmax(0,1fr))] gap-1">
          <span role="rowheader" :aria-label="`uke ${u.uke}`" class="grid place-items-center text-sm text-[var(--color-ink-3)] tabular-nums">{{ u.uke }}</span>
          <div v-for="(c, k) in u.celler" :key="k" role="cell">
            <component
              :is="c.billett === null ? 'div' : 'button'"
              v-if="c"
              :type="c.billett === null ? undefined : 'button'"
              class="relative grid min-h-11 w-full place-items-center rounded-md text-sm tabular-nums"
              :class="[
                c.billett === null && (c.helg || c.merke) ? 'text-[var(--color-ink-3)]' : 'text-[var(--color-ink)]',
                c.start ? 'border-l-[3px] border-[var(--color-accent)]' : '',
                c.billett !== null ? 'shadow-[inset_0_-3px_0_0_var(--color-accent)]' : '',
                c.billett !== null && valgt === c.billett ? 'inset-ring-2 inset-ring-[var(--color-ink)]' : '',
              ]"
              :style="c.billett === null ? null : { background: `color-mix(in srgb, var(--color-accent) ${c.flate}%, transparent)` }"
              :aria-label="c.billett === null ? undefined : c.tekst"
              :aria-pressed="c.billett === null ? undefined : valgt === c.billett"
              @click="c.billett !== null && velg(c.billett)"
            >
              <span :class="c.merke ? 'italic' : ''" :aria-hidden="c.billett === null ? 'true' : undefined">{{ c.dag }}</span>
              <span v-if="c.billett === null" class="sr-only">{{ c.tekst }}</span>
              <i v-if="c.enkelt" class="absolute bottom-1 h-0.5 w-3 bg-[var(--color-warn)]" aria-hidden="true"></i>
              <i v-else-if="c.merke" class="absolute bottom-1 h-1 w-1 rounded-full bg-[var(--color-ink-3)]" aria-hidden="true"></i>
            </component>
          </div>
        </div>
      </div>
      </div>
      <p class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--color-ink-2)]">
        <span v-for="d in brukte" :key="d"><i class="mr-1.5 inline-block h-3 w-4 rounded-sm border-2 border-[var(--color-accent)] align-middle" :style="{ background: fyll(d) }"></i>{{ dagerTekst(d) }}</span>
        <span><i class="mr-1.5 inline-block h-3 w-0.5 bg-[var(--color-accent)] align-middle"></i>aktivering</span>
        <span><i class="mr-1.5 inline-block h-1 w-1 rounded-full bg-[var(--color-ink-3)] align-middle"></i>fri, ferie eller hjemmekontor</span>
        <span v-if="enkelt.length"><i class="mr-1.5 inline-block h-0.5 w-3 bg-[var(--color-warn)] align-middle"></i>enkeltbillett</span>
      </p>
    </template>

    <template v-if="visning !== 'tabell'">
      <div aria-live="polite">
        <div v-if="detalj" class="mt-4 rounded-xl bg-[var(--color-app)] p-3 text-sm">
          <p class="font-semibold">{{ dagerTekst(detalj.dager) }} · {{ kr(detalj.pris) }}<Estimat v-if="detalj.estimert" /></p>
          <dl class="mt-1 grid grid-cols-[auto_1fr] gap-x-3 text-[var(--color-ink-2)]">
            <template v-if="utfall.flereRuter"><dt>Strekning</dt><dd>{{ detalj.strekningNavn }}</dd></template>
            <dt>Aktiver</dt><dd>{{ norskTidspunkt(detalj.aktivering) }}</dd>
            <dt>Utløper</dt><dd>{{ norskTidspunkt(detalj.utloper) }}</dd>
            <dt>Dekker</dt><dd>{{ detalj.antallTurer }} reiser</dd>
          </dl>
          <p v-if="detalj.passPaa" class="mt-2 text-[var(--color-warn)]"><span aria-hidden="true">⚠ </span>Tett margin – aktiver i tide.</p>
        </div>
        <p v-else class="mt-3 text-sm text-[var(--color-ink-2)]">{{ visning === 'kalender' ? 'Trykk på en farget dag for detaljer.' : 'Trykk på en billett for detaljer.' }}</p>
      </div>
    </template>

    <template v-else>
      <div class="mt-4 overflow-x-auto" role="region" aria-label="Tabell over billettene" tabindex="0">
        <table class="w-full min-w-[40rem] border-collapse text-left text-sm whitespace-nowrap tabular-nums">
          <caption class="sr-only">Periodebillettene i billigste løsning</caption>
          <thead class="text-sm text-[var(--color-ink-3)]">
            <tr>
              <th scope="col" class="sticky left-0 z-10 bg-[var(--color-surface)] shadow-[1px_0_0_var(--color-line)] py-2 pr-3 font-medium">Uke</th>
              <th scope="col" class="px-3 py-2 font-medium">Utnyttelse</th>
              <th scope="col" class="px-3 py-2 font-medium">Turer</th>
              <th scope="col" class="px-3 py-2 font-medium">Fra</th>
              <th scope="col" class="px-3 py-2 font-medium">Til</th>
              <th scope="col" class="px-3 py-2 font-medium">Billett</th>
              <th scope="col" class="px-3 py-2 font-medium">Pris</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rader" :key="r.i" class="border-t border-[var(--color-line)] align-top">
              <th scope="row" class="sticky left-0 z-10 bg-[var(--color-surface)] shadow-[1px_0_0_var(--color-line)] py-2 pr-3 text-left font-normal">{{ r.ukeFra }}<template v-if="r.dager >= 365"><svg class="ml-1 inline-block h-3 w-3 align-baseline" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" /></svg><span class="sr-only"> (årskort starter)</span></template><span v-if="r.ukeRest" class="block text-[var(--color-ink-3)]">{{ r.ukeRest }}</span></th>
              <td class="px-3 py-2" :class="r.prosent < ADVARSEL_PROSENT ? 'text-[var(--color-warn)]' : ''">
                {{ r.prosent }} %
                <span class="mt-1 block h-1 w-9 overflow-hidden rounded-full bg-[var(--color-line)]" aria-hidden="true"><span class="block h-full rounded-full" :class="r.prosent < ADVARSEL_PROSENT ? 'bg-[var(--color-warn)]' : 'bg-[var(--color-accent)]'" :style="{ width: r.prosent + '%' }"></span></span>
              </td>
              <td class="px-3 py-2">{{ r.antallTurer }}</td>
              <td class="px-3 py-2">{{ dagTekst(r.fra) }}<span class="block text-sm text-[var(--color-ink-3)]">{{ r.klokkeFra }}</span></td>
              <td class="px-3 py-2">{{ dagTekst(r.til) }}<span class="block text-sm text-[var(--color-ink-3)]">{{ r.klokkeTil }}</span></td>
              <td class="px-3 py-2">{{ dagerTekst(r.dager) }}<span v-if="utfall.flereRuter" class="block text-sm text-[var(--color-ink-3)]">{{ r.strekningNavn }}</span></td>
              <td class="px-3 py-2">{{ kr(r.pris) }}<Estimat v-if="r.estimert" /></td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t border-[var(--color-ink-3)] font-semibold">
              <th scope="row" class="sticky left-0 z-10 bg-[var(--color-surface)] shadow-[1px_0_0_var(--color-line)] py-2 pr-3 text-left">Sum</th>
              <td></td>
              <td class="px-3 py-2">{{ sum.turer }}</td>
              <td colspan="3"></td>
              <td class="px-3 py-2">{{ kr(sum.pris) }}<Estimat v-if="sum.estimert" /></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p class="mt-2 text-sm text-[var(--color-ink-3)]">Utnyttelse = reiser billetten dekker ÷ reiser en full arbeidsuke (man–fre) ville gitt i gyldighetstiden. Hjemmekontor, ferie og fridager gir lavere tall.<template v-if="sum.estimert"> * Estimert pris med prisøkning.</template></p>
      <p class="mt-2 text-sm text-[var(--color-ink-3)]">Summen er hele billettprisene. Hovedtallet regner siste billett forholdsmessig og tar også med enkeltbilletter og tillegg.</p>
    </template>

    <details v-if="enkelt.length" class="mt-4">
      <summary class="vis-pil min-h-11 text-sm font-medium">Dager med enkeltbillett ({{ enkelt.length }})</summary>
      <ul class="mt-1 divide-y divide-[var(--color-line)] text-sm">
        <li v-for="d in enkelt" :key="d.dato" class="flex justify-between gap-3 py-1.5">
          <span>{{ norskDato(d.dato, true) }}</span>
          <span class="tabular-nums">{{ kr(d.kostnad) }}</span>
        </li>
      </ul>
    </details>
  </section>
</template>
