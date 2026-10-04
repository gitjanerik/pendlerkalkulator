<script setup>
import { computed } from 'vue'
import { kr, norskDato } from '../lib/format.js'
import Estimat from './Estimat.vue'

const p = defineProps({ utfall: Object })
const fritid = computed(() => p.utfall.fritid)

const RETNING = { ned: 'Opp til', hjem: 'Hjem fra' }
const status = (r) => {
  if (r.dekning === 'periode') return `Dekket av ${r.dager >= 365 ? 'årskortet' : `${r.dager}-dagersbilletten`}. Kjøp bare tillegget Oslo S–Oslo lufthavn.`
  if (r.dekning === 'eksisterende') return 'Dekket av billetten du har nå. Kjøp bare tillegget Oslo S–Oslo lufthavn.'
  return 'Ingen periodebillett gyldig. Kjøp én enkeltbillett hele veien.'
}
</script>

<template>
  <section v-if="fritid" class="kort" aria-labelledby="fr-tittel">
    <h2 id="fr-tittel" class="seksjonstittel">Fritidsreiser til Oslo lufthavn</h2>
    <p class="mt-1 text-sm text-[var(--color-ink-2)]">
      Til sammen {{ kr(fritid.sum) }}<Estimat v-if="fritid.estimert" />, med i totalen.
    </p>
    <ul class="mt-3 flex flex-col divide-y divide-[var(--color-line)]">
      <li v-for="r in fritid.reiser" :key="r.tid + r.retning" class="py-2 text-sm">
        <p class="flex items-baseline justify-between gap-3">
          <span class="font-semibold">{{ RETNING[r.retning] }} Oslo lufthavn {{ norskDato(r.dato, true) }}</span>
          <span class="shrink-0 tabular-nums">{{ kr(r.pris) }}<Estimat v-if="r.estimert" /></span>
        </p>
        <p class="text-[var(--color-ink-2)]">
          <span aria-hidden="true" :class="r.dekning === 'enkelt' ? 'text-[var(--color-warn)]' : ''">{{ r.dekning === 'enkelt' ? '⚠ ' : '✓ ' }}</span>{{ status(r) }}
        </p>
      </li>
    </ul>
    <p v-if="fritid.estimert" class="mt-2 text-sm text-[var(--color-ink-3)]">* Estimat: regner med årlig prisøkning hver 1. februar.</p>
  </section>
</template>
