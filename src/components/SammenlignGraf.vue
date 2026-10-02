<script setup>
import { computed, ref } from 'vue'
import { kr } from '../lib/format.js'

const p = defineProps({ utfall: Object })
const valgt = ref(null)

// Radene starter på 0 kr (ingen avkuttet akse); overskuddet over beste vises i varselfarge.
const rader = computed(() => {
  const beste = p.utfall.resultat.kostnad
  const alle = [
    { navn: 'Billigste kjede', kost: beste, diff: 0, beste: true },
    ...p.utfall.alternativer.map((a) => ({ navn: a.navn, kost: a.resultat.kostnad, diff: a.differanse })),
  ]
  const maks = Math.max(...alle.map((r) => r.kost)) || 1
  return alle.map((r) => ({
    ...r,
    bestePct: (Math.min(r.kost, beste) / maks) * 100,
    diffPct: (Math.max(r.kost - beste, 0) / maks) * 100,
  }))
})
</script>

<template>
  <section class="kort" aria-labelledby="sg-tittel">
    <h2 id="sg-tittel" class="seksjonstittel">Mot enklere alternativer</h2>
    <ul class="mt-3 flex flex-col gap-1">
      <li v-for="r in rader" :key="r.navn">
        <button
          type="button"
          class="w-full rounded-lg px-1 py-2 text-left hover:bg-[var(--color-app)]"
          :aria-pressed="valgt === r.navn"
          @click="valgt = valgt === r.navn ? null : r.navn"
        >
          <span class="flex items-baseline justify-between gap-2 text-sm">
            <span :class="r.beste ? 'font-semibold' : ''">{{ r.navn }}</span>
            <span class="tabular-nums">
              {{ kr(r.kost) }}
              <span v-if="r.diff > 0" class="text-[var(--color-warn)]">&nbsp;+{{ kr(r.diff) }}</span>
            </span>
          </span>
          <span class="mt-1 flex h-3" aria-hidden="true">
            <span class="rounded-l-sm bg-[var(--color-accent)]" :style="{ width: r.bestePct + '%' }"></span>
            <span v-if="r.diffPct" class="ml-0.5 rounded-r-sm bg-[var(--color-warn)]" :style="{ width: r.diffPct + '%' }"></span>
          </span>
          <span v-if="valgt === r.navn" class="mt-1 block text-sm text-[var(--color-ink-2)]">
            {{ r.beste ? 'Kombinerer periodebilletter og enkeltreiser der det lønner seg.' : r.diff > 0 ? `${kr(r.diff)} dyrere over perioden (${Math.round((r.diff / p.utfall.resultat.kostnad) * 100)} %).` : 'Like billig.' }}
          </span>
        </button>
      </li>
    </ul>
  </section>
</template>
