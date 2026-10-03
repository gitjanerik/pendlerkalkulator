<script setup>
import { computed, nextTick, ref } from 'vue'
import { slaaSammenFerie } from '../lib/ics.js'
import { norskDato } from '../lib/format.js'
import Kalender from './Kalender.vue'
import IcsImport from './IcsImport.vue'

const m = defineModel({ type: Object })
const velger = ref(false)
const kal = ref(null)
const listeEl = ref(null)
const leggTilKnapp = ref(null)
const melding = ref('')

const liste = computed(() => [...m.value.ferie].sort((a, b) => a.fra.localeCompare(b.fra)))
const tekst = (f) => (f.fra === f.til ? norskDato(f.fra, true) : `${norskDato(f.fra)} – ${norskDato(f.til, true)}`)

const veksleVelger = async () => {
  velger.value = !velger.value
  if (!velger.value) return
  await nextTick()
  kal.value?.fokuser()
}
// Kalenderen forsvinner, så fokus må tilbake til knappen som åpnet den.
const lukk = () => {
  velger.value = false
  nextTick(() => leggTilKnapp.value?.focus())
}
const legTil = (omr) => {
  m.value.ferie = slaaSammenFerie([...m.value.ferie, omr])
  melding.value = `Ferie lagt til: ${tekst(omr)}`
  lukk()
}
const importer = (i) => {
  m.value.ferie = slaaSammenFerie([...m.value.ferie, ...i])
  melding.value = `${i.length} ferieperioder lagt til`
}
// Knappen som ble trykt forsvinner; fokus går til naboen, ellers til «Legg til».
const fjern = async (f) => {
  const pos = liste.value.indexOf(f)
  m.value.ferie = m.value.ferie.filter((x) => x !== f && !(x.fra === f.fra && x.til === f.til))
  melding.value = `Fjernet ferie ${tekst(f)}`
  await nextTick()
  const knapper = listeEl.value?.querySelectorAll('button')
  ;(knapper?.[Math.min(pos, knapper.length - 1)] ?? leggTilKnapp.value)?.focus()
}
</script>

<template>
  <div>
    <ul v-if="liste.length" ref="listeEl" class="flex flex-col divide-y divide-[var(--color-line)]">
      <li v-for="f in liste" :key="f.fra + f.til" class="flex items-center justify-between gap-2 py-1">
        <span class="min-w-0 break-words">{{ tekst(f) }}</span>
        <button type="button" class="knapp shrink-0 px-3" :aria-label="`Fjern ferie ${tekst(f)}`" @click="fjern(f)">✕</button>
      </li>
    </ul>
    <p v-else class="text-sm text-[var(--color-ink-2)]">Ingen ferie registrert ennå.</p>
    <p class="sr-only" role="status">{{ melding }}</p>

    <div class="mt-3 flex flex-wrap gap-2">
      <button ref="leggTilKnapp" type="button" class="knapp" :aria-expanded="velger" aria-controls="ferie-kalender" @click="veksleVelger">+ Legg til ferie</button>
      <IcsImport @importer="importer" />
    </div>
    <div v-if="velger" id="ferie-kalender" class="mt-3 rounded-xl border border-[var(--color-line)] p-3">
      <Kalender ref="kal" @velg="legTil" @lukk="lukk" />
    </div>
  </div>
</template>
