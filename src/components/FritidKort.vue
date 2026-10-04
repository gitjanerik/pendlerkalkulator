<script setup>
import { computed } from 'vue'
import { kr, norskDato } from '../lib/format.js'
import Estimat from './Estimat.vue'

const p = defineProps({ utfall: Object })
const fritid = computed(() => p.utfall.fritid)

const retning = (r) => (r.retning === 'ned' ? `${fritid.value.fra} til` : 'Hjem fra')
const status = (r) => {
  const { forhold, maal } = fritid.value
  if (forhold === 'utenfor') return `${maal} ligger ikke på veien til flyplassen. Kjøp enkeltbillett hele veien.`
  const rest = forhold === 'bak' ? `Kjøp bare tillegget ${maal}–Oslo lufthavn.` : `Flyplassen ligger før ${maal}, så du trenger ingen ekstra billett.`
  if (r.dekning === 'periode') return `Dekket av ${r.dager >= 365 ? 'årskortet' : `${r.dager}-dagersbilletten`}. ${rest}`
  if (r.dekning === 'eksisterende') return `Dekket av billetten du har nå. ${rest}`
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
          <span class="font-semibold">{{ retning(r) }} Oslo lufthavn {{ norskDato(r.dato, true) }}</span>
          <span class="shrink-0 tabular-nums">{{ r.pris ? kr(r.pris) : 'Inkludert' }}<Estimat v-if="r.pris && r.estimert" /></span>
        </p>
        <p class="text-[var(--color-ink-2)]">
          <span aria-hidden="true" :class="r.dekning === 'enkelt' && fritid.forhold !== 'utenfor' ? 'text-[var(--color-warn)]' : ''">{{ fritid.forhold === 'utenfor' ? '• ' : r.dekning === 'enkelt' ? '⚠ ' : '✓ ' }}</span>{{ status(r) }}
        </p>
      </li>
    </ul>
    <p v-if="fritid.estimert" class="mt-2 text-sm text-[var(--color-ink-3)]">* Estimat: antar årlig prisøkning rundt 1. februar.</p>
  </section>
</template>
