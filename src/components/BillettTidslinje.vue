<script setup>
import { computed, ref } from 'vue'
import { dagNr, isoFraDagNr } from '../lib/dato.js'
import { kr, norskTidspunkt, norskDato, dagerTekst } from '../lib/format.js'

const p = defineProps({ utfall: Object })
const valgt = ref(null)

const MND = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des']
// Skyggen følger billettlengde: lengre billett, mørkere flate.
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
</script>

<template>
  <section class="kort" aria-labelledby="bt-tittel">
    <h2 id="bt-tittel" class="seksjonstittel">Billettene dine</h2>
    <div class="relative mt-4 h-[4.25rem]" role="group" aria-label="Billetter langs tidsaksen">
      <div class="absolute inset-x-0 top-2 h-px bg-[var(--color-line)]"></div>
      <button
        v-for="s in segmenter"
        :key="s.i"
        type="button"
        class="absolute top-0 h-5 rounded-sm bg-[var(--color-accent)] outline-offset-2"
        :class="valgt === s.i ? 'outline-2 outline-[var(--color-ink)]' : ''"
        :style="{ left: s.left + '%', width: s.width + '%', opacity: skygge(s.dager) / 100 }"
        :aria-label="`${dagerTekst(s.dager)}, ${kr(s.pris)}`"
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
      <p class="font-semibold">{{ dagerTekst(detalj.dager) }} · {{ kr(detalj.pris) }}</p>
      <dl class="mt-1 grid grid-cols-[auto_1fr] gap-x-3 text-[var(--color-ink-2)]">
        <dt>Aktiver</dt><dd>{{ norskTidspunkt(detalj.aktivering) }}</dd>
        <dt>Utløper</dt><dd>{{ norskTidspunkt(detalj.utloper) }}</dd>
        <dt>Dekker</dt><dd>{{ detalj.antallTurer }} reiser</dd>
      </dl>
      <p v-if="detalj.passPaa" class="mt-2 text-[var(--color-warn)]">⚠ Tett margin – aktiver i tide.</p>
    </div>
    <p v-else class="mt-3 text-sm text-[var(--color-ink-3)]">Trykk på en billett for detaljer.</p>
  </section>
</template>
