<script setup>
import { computed, ref } from 'vue'
import { norskDato } from '../lib/format.js'
import { OSL_TILLEGG } from '../lib/fritid.js'
import Kalender from './Kalender.vue'

const m = defineModel({ type: Object })
const velger = ref(false)

const liste = computed(() => [...m.value.fritidsreiser].sort((a, b) => a.fra.localeCompare(b.fra)))
const tekst = (r) => `Ned ${norskDato(r.fra)} · hjem ${norskDato(r.til)}`
const legTil = (omr) => {
  m.value.fritidsreiser = [...m.value.fritidsreiser, { fra: omr.fra, til: omr.til }]
  velger.value = false
}
const fjern = (r) => (m.value.fritidsreiser = m.value.fritidsreiser.filter((x) => x !== r && !(x.fra === r.fra && x.til === r.til)))
</script>

<template>
  <div>
    <ul v-if="liste.length" class="flex flex-col divide-y divide-[var(--color-line)]">
      <li v-for="r in liste" :key="r.fra + r.til" class="flex items-center justify-between gap-2 py-1">
        <span class="min-w-0 break-words">{{ tekst(r) }}</span>
        <button type="button" class="knapp shrink-0 px-3" :aria-label="`Fjern fritidsreise: ${tekst(r)}`" @click="fjern(r)">✕</button>
      </li>
    </ul>
    <p v-else class="text-sm text-[var(--color-ink-2)]">Ingen fritidsreiser registrert ennå.</p>

    <div class="mt-3">
      <button type="button" class="knapp" :aria-expanded="velger" @click="velger = !velger">+ Legg til fritidsreise</button>
    </div>
    <div v-if="velger" class="mt-3 rounded-xl border border-[var(--color-line)] p-3">
      <Kalender tekst-start="Velg dagen du reiser ned, så dagen du kommer hjem." tekst-slutt="Ned {dato}. Velg dagen du kommer hjem." @velg="legTil" />
    </div>
    <p class="mt-3 text-sm text-[var(--color-ink-2)]">
      Til Oslo lufthavn trenger du bare tilleggsbillett Oslo S–Oslo lufthavn ({{ OSL_TILLEGG }} kr) når periodebilletten din er gyldig. Reiser før startdatoen eller etter sluttdatoen regnes ikke med.
    </p>
  </div>
</template>
