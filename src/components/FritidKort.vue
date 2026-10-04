<script setup>
import { computed } from 'vue'
import { kr, norskDato } from '../lib/format.js'
import Estimat from './Estimat.vue'

const p = defineProps({ utfall: Object })
const fritid = computed(() => p.utfall.fritid)

const RETNING = { ned: 'Opp til', hjem: 'Hjem fra' }
</script>

<template>
  <section v-if="fritid" class="kort" aria-labelledby="fr-tittel">
    <h2 id="fr-tittel" class="seksjonstittel">Fritidsreiser til Oslo lufthavn</h2>
    <p class="mt-1 text-sm text-[var(--color-ink-2)]">
      Egen enkeltbillett fra hjemstasjonen. Til sammen {{ kr(fritid.sum) }}<Estimat v-if="fritid.estimert" />, med i totalen.
    </p>
    <ul class="mt-3 flex flex-col divide-y divide-[var(--color-line)]">
      <li v-for="r in fritid.reiser" :key="r.tid + r.retning" class="flex items-baseline justify-between gap-3 py-2 text-sm">
        <span class="font-semibold">{{ RETNING[r.retning] }} Oslo lufthavn {{ norskDato(r.dato, true) }}</span>
        <span class="shrink-0 tabular-nums">{{ kr(r.pris) }}<Estimat v-if="r.estimert" /></span>
      </li>
    </ul>
    <p v-if="fritid.estimert" class="mt-2 text-sm text-[var(--color-ink-3)]">* Estimat: regner med årlig prisøkning hver 1. februar.</p>
  </section>
</template>
