<script setup>
import { computed, ref } from 'vue'
import { slaaSammenFerie } from '../lib/ics.js'
import { norskDato } from '../lib/format.js'
import Kalender from './Kalender.vue'
import IcsImport from './IcsImport.vue'

const m = defineModel({ type: Object })
const velger = ref(false)

const liste = computed(() => [...m.value.ferie].sort((a, b) => a.fra.localeCompare(b.fra)))
const tekst = (f) => (f.fra === f.til ? norskDato(f.fra, true) : `${norskDato(f.fra)} – ${norskDato(f.til, true)}`)
const legTil = (omr) => {
  m.value.ferie = slaaSammenFerie([...m.value.ferie, omr])
  velger.value = false
}
const fjern = (f) => (m.value.ferie = m.value.ferie.filter((x) => x !== f && !(x.fra === f.fra && x.til === f.til)))
</script>

<template>
  <div>
    <ul v-if="liste.length" class="flex flex-col divide-y divide-[var(--color-line)]">
      <li v-for="f in liste" :key="f.fra + f.til" class="flex items-center justify-between gap-2 py-1">
        <span>{{ tekst(f) }}</span>
        <button type="button" class="knapp px-3" :aria-label="`Fjern ferie ${tekst(f)}`" @click="fjern(f)">✕</button>
      </li>
    </ul>
    <p v-else class="text-sm text-[var(--color-ink-2)]">Ingen ferie registrert ennå.</p>

    <div class="mt-3 flex flex-wrap gap-2">
      <button type="button" class="knapp" :aria-expanded="velger" @click="velger = !velger">+ Legg til ferie</button>
      <IcsImport @importer="(i) => (m.ferie = slaaSammenFerie([...m.ferie, ...i]))" />
    </div>
    <div v-if="velger" class="mt-3 rounded-xl border border-[var(--color-line)] p-3">
      <Kalender @velg="legTil" />
    </div>
  </div>
</template>
