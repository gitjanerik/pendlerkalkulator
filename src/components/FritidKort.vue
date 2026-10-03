<script setup>
import { computed } from 'vue'
import { kr, norskDato } from '../lib/format.js'

const p = defineProps({ utfall: Object, stasjon: { type: String, default: 'hjemstasjonen' } })
const fritid = computed(() => p.utfall.fritid)

const RETNING = { ned: 'Ned', hjem: 'Hjem' }
const status = (r) => {
  if (r.dekning === 'periode') return `Dekket av ${r.dager >= 365 ? "årskortet" : `${r.dager}-dagersbilletten`}. Kjøp bare tillegget.`
  if (r.dekning === 'eksisterende') return 'Dekket av billetten du har nå. Kjøp bare tillegget.'
  return `Ingen periodebillett gyldig. Kjøp enkeltbillett ${p.stasjon}–Oslo S (${kr(r.pris)}) og tillegget.`
}
</script>

<template>
  <section v-if="fritid" class="kort" aria-labelledby="fr-tittel">
    <h2 id="fr-tittel" class="seksjonstittel">Fritidsreiser til Oslo lufthavn</h2>
    <p class="mt-1 text-sm text-[var(--color-ink-2)]">
      Tilleggsbillett Oslo S–Oslo lufthavn: {{ kr(fritid.tillegg) }} per reise. Til sammen {{ kr(fritid.sum) }}, med i totalen.
    </p>
    <ul class="mt-3 flex flex-col divide-y divide-[var(--color-line)]">
      <li v-for="r in fritid.reiser" :key="r.tid + r.retning" class="py-2 text-sm">
        <p class="font-semibold">{{ RETNING[r.retning] }} {{ norskDato(r.dato) }}</p>
        <p class="text-[var(--color-ink-2)]">
          <span aria-hidden="true" :class="r.dekning === 'enkelt' ? 'text-[var(--color-warn)]' : ''">{{ r.dekning === 'enkelt' ? '⚠ ' : '✓ ' }}</span>{{ status(r) }}
        </p>
      </li>
    </ul>
  </section>
</template>
