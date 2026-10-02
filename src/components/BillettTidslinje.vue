<script setup>
import { computed, ref } from 'vue'
import { dagNr, isoFraDagNr, ukedag } from '../lib/dato.js'
import { kr, norskTidspunkt, norskDato, dagerTekst, UKEDAG_NAVN } from '../lib/format.js'
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
const MND_LANG = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember']

const MND = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des']
// Skyggen følger billettlengde: lengre billett, mørkere flate.
const ADVARSEL_PROSENT = 90
const SKYGGE = { 7: 45, 30: 70 }
const skygge = (d) => SKYGGE[d] ?? 100

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
      prosent: Math.round(utnyttelse(b, p.utfall.tidsramme) * 100),
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
    for (let nr = dagNr(s.aktivering.slice(0, 10)); nr <= dagNr(s.sisteTur.dato); nr++) kart.set(nr, s.i)
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
const SKYGGE_FLATE = { 7: 22, 30: 38 }
const IKKE_ARBEID = { helligdag: 'helligdag', fri: 'fri', ferie: 'ferie', hjemmekontor: 'hjemmekontor' }
const maanedsTittel = computed(() => {
  const [aar, mnd] = aktivMaaned.value.split('-').map(Number)
  return `${MND_LANG[mnd - 1]} ${aar}`
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
      flate: b ? (SKYGGE_FLATE[b.dager] ?? 55) : 0,
      tekst: [dagTekst(iso), b ? `${dagerTekst(b.dager)}-billett` : null, enkeltDatoer.value.has(iso) ? 'enkeltbillett' : null, IKKE_ARBEID[type] ?? null].filter(Boolean).join(', '),
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
    <div class="flex items-center justify-between gap-3">
      <h2 id="bt-tittel" class="seksjonstittel">Billettene dine</h2>
      <div class="flex gap-1 rounded-xl border border-[var(--color-line)] p-0.5" role="group" aria-label="Visning">
        <button
          v-for="v in VISNINGER"
          :key="v.id"
          type="button"
          class="grid h-10 w-10 place-items-center rounded-[0.625rem] text-[var(--color-ink-2)] transition-colors hover:bg-[var(--color-app)] aria-pressed:bg-[var(--color-accent)] aria-pressed:text-[var(--color-on-accent)]"
          :aria-pressed="visning === v.id"
          :aria-label="v.navn"
          :title="v.navn"
          @click="visning = v.id"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="v.ikon" /></svg>
        </button>
      </div>
    </div>

    <template v-if="visning === 'tidslinje'">
    <div class="relative mt-4 h-[4.25rem]" role="group" aria-label="Billetter langs tidsaksen">
      <div class="absolute inset-x-0 top-2 h-px bg-[var(--color-line)]"></div>
      <button
        v-for="s in segmenter"
        :key="s.i"
        type="button"
        class="absolute top-0 h-5 rounded-sm bg-[var(--color-accent)] outline-offset-2"
        :class="valgt === s.i ? 'outline-2 outline-[var(--color-ink)]' : ''"
        :style="{ left: s.left + '%', width: s.width + '%', opacity: skygge(s.dager) / 100 }"
        :aria-label="`${dagerTekst(s.dager)}, ${kr(s.pris)}${s.estimert ? ' (estimert)' : ''}`"
        :aria-pressed="valgt === s.i"
        @click="velg(s.i)"
      ></button>
      <span
        v-for="d in enkelt"
        :key="d.dato"
        class="absolute top-6 h-2 w-0.5 bg-[var(--color-warn)]"
        :style="{ left: d.left + '%' }"
        :title="`${norskDato(d.dato)}: enkeltbillett ${kr(d.kostnad)}`"
        aria-hidden="true"
      ></span>
      <span
        v-for="f in fritidMerker"
        :key="f.tid + f.retning"
        class="absolute top-[2.25rem] h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-[var(--color-ink)]"
        :style="{ left: Math.min(Math.max(f.left, 1), 99) + '%' }"
        :title="`${norskDato(f.dato)}: fritidsreise til Oslo lufthavn`"
        aria-hidden="true"
      ></span>
      <span
        v-for="mnd in maaneder"
        :key="mnd.left"
        class="absolute bottom-0 -translate-x-1/2 text-xs text-[var(--color-ink-3)]"
        :style="{ left: Math.min(Math.max(mnd.left, 3), 97) + '%' }"
        aria-hidden="true"
        >{{ mnd.tekst }}</span
      >
    </div>
    <p class="mt-2 flex flex-wrap gap-x-4 text-xs text-[var(--color-ink-2)]">
      <span v-for="d in brukte" :key="d"><i class="mr-1 inline-block h-2 w-3 rounded-sm bg-[var(--color-accent)]" :style="{ opacity: skygge(d) / 100 }"></i>{{ dagerTekst(d) }}</span>
      <span v-if="fritid.length"><i class="mr-1 inline-block h-2 w-2 rotate-45 bg-[var(--color-ink)]"></i>fritidsreise</span>
      <span v-if="enkelt.length"><i class="mr-1 inline-block h-2 w-0.5 bg-[var(--color-warn)]"></i>enkeltbillett</span>
    </p>

    <div v-if="detalj" class="mt-4 rounded-xl bg-[var(--color-app)] p-3 text-sm" aria-live="polite">
      <p class="font-semibold">{{ dagerTekst(detalj.dager) }} · {{ kr(detalj.pris) }}<Estimat v-if="detalj.estimert" /></p>
      <dl class="mt-1 grid grid-cols-[auto_1fr] gap-x-3 text-[var(--color-ink-2)]">
        <dt>Aktiver</dt><dd>{{ norskTidspunkt(detalj.aktivering) }}</dd>
        <dt>Utløper</dt><dd>{{ norskTidspunkt(detalj.utloper) }}</dd>
        <dt>Dekker</dt><dd>{{ detalj.antallTurer }} reiser</dd>
      </dl>
      <p v-if="detalj.passPaa" class="mt-2 text-[var(--color-warn)]">⚠ Tett margin – aktiver i tide.</p>
    </div>
    <p v-else class="mt-3 text-sm text-[var(--color-ink-3)]">Trykk på en billett for detaljer.</p>
    </template>

    <template v-else-if="visning === 'kalender'">
      <div class="mt-4 flex items-center justify-between">
        <button type="button" class="chip px-0" aria-label="Forrige måned" :disabled="aktivMaaned <= forsteMaaned" @click="flyttMaaned(-1)">‹</button>
        <p class="font-semibold capitalize" aria-live="polite">{{ maanedsTittel }}</p>
        <button type="button" class="chip px-0" aria-label="Neste måned" :disabled="aktivMaaned >= sisteMaaned" @click="flyttMaaned(1)">›</button>
      </div>
      <div class="mt-3 grid grid-cols-[1.5rem_repeat(7,minmax(0,1fr))] gap-1 text-center text-xs text-[var(--color-ink-3)]" aria-hidden="true">
        <span>uke</span><span v-for="d in UKEDAG_NAVN" :key="d">{{ d }}</span>
      </div>
      <div v-for="u in uker" :key="u.uke" class="mt-1 grid grid-cols-[1.5rem_repeat(7,minmax(0,1fr))] gap-1">
        <span class="grid place-items-center text-xs text-[var(--color-ink-3)] tabular-nums" aria-label="uke">{{ u.uke }}</span>
        <template v-for="(c, k) in u.celler" :key="k">
          <span v-if="!c" aria-hidden="true"></span>
          <component
            :is="c.billett === null ? 'div' : 'button'"
            v-else
            :type="c.billett === null ? undefined : 'button'"
            class="relative grid aspect-square place-items-center rounded-md text-sm tabular-nums"
            :class="[
              c.helg || c.merke ? 'text-[var(--color-ink-3)]' : 'text-[var(--color-ink)]',
              c.start ? 'border-l-[3px] border-[var(--color-accent)]' : '',
              c.billett !== null && valgt === c.billett ? 'outline-2 -outline-offset-2 outline-[var(--color-ink)]' : '',
            ]"
            :style="c.billett === null ? null : { background: `color-mix(in srgb, var(--color-accent) ${c.flate}%, transparent)` }"
            :aria-label="c.tekst"
            :aria-pressed="c.billett === null ? undefined : valgt === c.billett"
            @click="c.billett !== null && velg(c.billett)"
          >
            <span :class="c.merke ? 'italic' : ''">{{ c.dag }}</span>
            <i v-if="c.enkelt" class="absolute bottom-1 h-0.5 w-3 bg-[var(--color-warn)]" aria-hidden="true"></i>
            <i v-else-if="c.merke" class="absolute bottom-1 h-1 w-1 rounded-full bg-[var(--color-ink-3)]" aria-hidden="true"></i>
          </component>
        </template>
      </div>
      <p class="mt-3 flex flex-wrap gap-x-4 text-xs text-[var(--color-ink-2)]">
        <span v-for="d in brukte" :key="d"><i class="mr-1 inline-block h-2 w-3 rounded-sm bg-[var(--color-accent)]" :style="{ opacity: skygge(d) / 100 }"></i>{{ dagerTekst(d) }}</span>
        <span><i class="mr-1 inline-block h-2.5 w-0.5 bg-[var(--color-accent)]"></i>aktivering</span>
        <span><i class="mr-1 inline-block h-1 w-1 rounded-full bg-[var(--color-ink-3)]"></i>fri/ferie/hjemmekontor</span>
        <span v-if="enkelt.length"><i class="mr-1 inline-block h-0.5 w-3 bg-[var(--color-warn)]"></i>enkeltbillett</span>
      </p>
      <div v-if="detalj" class="mt-4 rounded-xl bg-[var(--color-app)] p-3 text-sm" aria-live="polite">
        <p class="font-semibold">{{ dagerTekst(detalj.dager) }} · {{ kr(detalj.pris) }}<Estimat v-if="detalj.estimert" /></p>
        <dl class="mt-1 grid grid-cols-[auto_1fr] gap-x-3 text-[var(--color-ink-2)]">
          <dt>Aktiver</dt><dd>{{ norskTidspunkt(detalj.aktivering) }}</dd>
          <dt>Utløper</dt><dd>{{ norskTidspunkt(detalj.utloper) }}</dd>
          <dt>Dekker</dt><dd>{{ detalj.antallTurer }} reiser</dd>
        </dl>
        <p v-if="detalj.passPaa" class="mt-2 text-[var(--color-warn)]">⚠ Tett margin – aktiver i tide.</p>
      </div>
      <p v-else class="mt-3 text-sm text-[var(--color-ink-3)]">Trykk på en farget dag for detaljer.</p>
    </template>

    <template v-else>
      <div class="mt-4 overflow-x-auto" role="region" aria-labelledby="bt-tittel" tabindex="0">
        <table class="w-full min-w-[40rem] border-collapse text-left text-sm whitespace-nowrap tabular-nums">
          <thead class="text-xs text-[var(--color-ink-3)]">
            <tr>
              <th scope="col" class="sticky left-0 z-10 bg-[var(--color-surface)] shadow-[1px_0_0_var(--color-line)] py-2 pr-3 font-medium">Uke</th>
              <th scope="col" class="px-3 py-2 font-medium">Utn.</th>
              <th scope="col" class="px-3 py-2 font-medium">Turer</th>
              <th scope="col" class="px-3 py-2 font-medium">Fra</th>
              <th scope="col" class="px-3 py-2 font-medium">Til</th>
              <th scope="col" class="px-3 py-2 font-medium">Billett</th>
              <th scope="col" class="py-2 pl-3 font-medium">Pris</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rader" :key="r.i" class="border-t border-[var(--color-line)] align-top">
              <th scope="row" class="sticky left-0 z-10 bg-[var(--color-surface)] shadow-[1px_0_0_var(--color-line)] py-2 pr-3 text-left font-normal">{{ r.ukeFra }}<sup v-if="r.dager >= 365" class="ml-0.5 text-[0.9em] leading-none" title="Årskort starter" aria-label="årskort starter"><span aria-hidden="true">∞</span></sup>{{ r.ukeRest }}</th>
              <td class="px-3 py-2" :class="r.prosent < ADVARSEL_PROSENT ? 'text-[var(--color-warn)]' : ''">
                {{ r.prosent }} %
                <span class="mt-1 block h-1 w-9 overflow-hidden rounded-full bg-[var(--color-line)]" aria-hidden="true"><span class="block h-full rounded-full" :class="r.prosent < ADVARSEL_PROSENT ? 'bg-[var(--color-warn)]' : 'bg-[var(--color-accent)]'" :style="{ width: r.prosent + '%' }"></span></span>
              </td>
              <td class="px-3 py-2">{{ r.antallTurer }}</td>
              <td class="px-3 py-2">{{ dagTekst(r.fra) }}<span class="block text-xs text-[var(--color-ink-3)]">{{ r.klokkeFra }}</span></td>
              <td class="px-3 py-2">{{ dagTekst(r.til) }}<span class="block text-xs text-[var(--color-ink-3)]">{{ r.klokkeTil }}</span></td>
              <td class="px-3 py-2">{{ r.dager >= 365 ? `${r.dager} d (årskort)` : `${r.dager} d` }}</td>
              <td class="py-2 pl-3">{{ kr(r.pris) }}<Estimat v-if="r.estimert" /></td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t border-[var(--color-ink-3)] font-semibold">
              <th scope="row" class="sticky left-0 z-10 bg-[var(--color-surface)] shadow-[1px_0_0_var(--color-line)] py-2 pr-3 text-left">Sum</th>
              <td></td>
              <td class="px-3 py-2">{{ sum.turer }}</td>
              <td colspan="3"></td>
              <td class="py-2 pl-3">{{ kr(sum.pris) }}<Estimat v-if="sum.estimert" /></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p class="mt-2 text-xs text-[var(--color-ink-3)]">Utn. = utnyttelse: reiser billetten dekker ÷ reiser en full arbeidsuke (man–fre) ville gitt i gyldighetstiden. Hjemmekontor, ferie og fridager gir lavere tall.<template v-if="sum.estimert"> * Estimert pris med prisøkning.</template></p>
    </template>
  </section>
</template>
