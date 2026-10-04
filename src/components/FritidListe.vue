<script setup>
import { computed, nextTick, ref } from 'vue'
import { norskDato } from '../lib/format.js'
import Kalender from './Kalender.vue'

const m = defineModel({ type: Object })
const velger = ref(false)
const kal = ref(null)
const listeEl = ref(null)
const leggTilKnapp = ref(null)
const melding = ref('')

const liste = computed(() => [...m.value.fritidsreiser].sort((a, b) => a.fra.localeCompare(b.fra)))
const tekst = (r) => `Opp ${norskDato(r.fra, true)} · hjem ${norskDato(r.til, true)}`

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
  m.value.fritidsreiser = [...m.value.fritidsreiser, { fra: omr.fra, til: omr.til }]
  melding.value = `Fritidsreise lagt til: ${tekst(omr)}`
  lukk()
}
// Knappen som ble trykt forsvinner; fokus går til naboen, ellers til «Legg til».
const fjern = async (r) => {
  const pos = liste.value.indexOf(r)
  m.value.fritidsreiser = m.value.fritidsreiser.filter((x) => x !== r && !(x.fra === r.fra && x.til === r.til))
  melding.value = `Fjernet fritidsreise: ${tekst(r)}`
  await nextTick()
  const knapper = listeEl.value?.querySelectorAll('button')
  ;(knapper?.[Math.min(pos, knapper.length - 1)] ?? leggTilKnapp.value)?.focus()
}
</script>

<template>
  <div>
    <ul v-if="liste.length" ref="listeEl" class="flex flex-col divide-y divide-[var(--color-line)]">
      <li v-for="r in liste" :key="r.fra + r.til" class="flex items-center justify-between gap-2 py-1">
        <span class="min-w-0 break-words">{{ tekst(r) }}</span>
        <button type="button" class="knapp min-w-11 shrink-0 px-3" :aria-label="`Fjern fritidsreise: ${tekst(r)}`" @click="fjern(r)">✕</button>
      </li>
    </ul>
    <p v-else class="text-sm text-[var(--color-ink-2)]">Ingen fritidsreiser registrert ennå.</p>
    <p class="sr-only" role="status">{{ melding }}</p>

    <div class="mt-3">
      <button ref="leggTilKnapp" type="button" class="knapp" :aria-expanded="velger" aria-controls="fritid-kalender" @click="veksleVelger">+ Legg til fritidsreise</button>
    </div>
    <div v-if="velger" id="fritid-kalender" class="mt-3 rounded-xl border border-[var(--color-line)] p-3">
      <Kalender ref="kal" tekst-start="Velg dagen du reiser opp til flyplassen, så dagen du kommer hjem." tekst-slutt="Opp {dato}. Velg dagen du kommer hjem." @velg="legTil" @lukk="lukk" />
    </div>
    <p class="mt-3 text-sm text-[var(--color-ink-2)]">
      Har du gyldig periodebillett, kjøper du bare tillegget Oslo S–Oslo lufthavn. Ellers kjøper du én enkeltbillett fra hjemstasjonen til Oslo lufthavn. Reiser før startdatoen eller etter sluttdatoen regnes ikke med.
    </p>
  </div>
</template>
