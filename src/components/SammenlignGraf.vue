<script setup>
import { computed, ref } from 'vue'
import { dagerTekst, flertall, kr } from '../lib/format.js'
import Estimat from './Estimat.vue'

const p = defineProps({ utfall: Object })
const valgt = ref(null)

// Radene starter på 0 kr (ingen avkuttet akse); overskuddet over beste vises i varselfarge.
const sammensetning = computed(() => {
  const { billetter, udekteDager } = p.utfall.resultat
  const perType = new Map()
  for (const b of billetter) perType.set(b.dager, (perType.get(b.dager) ?? 0) + 1)
  const deler = [...perType].sort(([a], [b]) => a - b).map(([dager, n]) => `${n} × ${dagerTekst(dager)}`)
  const enkelt = udekteDager.reduce((sum, d) => sum + d.antallTurer, 0)
  if (enkelt) deler.push(flertall(enkelt, 'enkeltbillett', 'enkeltbilletter'))
  return deler.join(', ')
})

const rader = computed(() => {
  const beste = p.utfall.resultat.kostnad
  const typer = new Set(p.utfall.resultat.billetter.map((b) => b.dager))
  if (p.utfall.resultat.udekteDager.length) typer.add('enkelt')
  const alle = [
    { navn: 'Billigst', kost: beste, estimert: p.utfall.resultat.estimert, diff: 0, beste: true, flereTyper: typer.size > 1 },
    ...p.utfall.alternativer.map((a) => ({ navn: a.navn, kost: a.resultat.kostnad, estimert: a.resultat.estimert, diff: a.differanse })),
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
    <h2 id="sg-tittel" class="seksjonstittel">Billettsammenligning</h2>
    <p class="mt-1 text-sm text-[var(--color-ink-2)]">Trykk på en rad for detaljer.</p>
    <ul class="mt-3 flex flex-col gap-1">
      <li v-for="r in rader" :key="r.navn">
        <button
          type="button"
          class="w-full rounded-lg px-1 py-2 text-left hover:bg-[var(--color-app)]"
          :aria-pressed="valgt === r.navn"
          @click="valgt = valgt === r.navn ? null : r.navn"
        >
          <span class="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-sm">
            <span class="flex min-w-0 items-center gap-1.5 break-words" :class="r.beste ? 'font-semibold' : ''">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="shrink-0 text-[var(--color-ink-3)] transition-transform" :class="{ 'rotate-180': valgt === r.navn }"><path d="M6 9l6 6 6-6" /></svg>
              {{ r.navn }}
              <svg v-if="r.flereTyper" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-[var(--color-accent)]" role="img" aria-label="Kombinerer flere billettyper"><title>Kombinerer flere billettyper</title><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
            </span>
            <span class="ml-auto tabular-nums">
              {{ kr(r.kost) }}<Estimat v-if="r.estimert" />
              <span v-if="r.diff > 0" class="ml-1 text-[var(--color-warn)]">+{{ kr(r.diff) }}</span>
            </span>
          </span>
          <span class="mt-1 flex h-3" aria-hidden="true">
            <span class="rounded-l-sm bg-[var(--color-accent)]" :style="{ width: r.bestePct + '%' }"></span>
            <span v-if="r.diffPct" class="ml-0.5 rounded-r-sm bg-[var(--color-warn)]" :style="{ width: r.diffPct + '%' }"></span>
          </span>
          <span v-if="valgt === r.navn" class="mt-1 block text-sm text-[var(--color-ink-2)]">
            {{ r.beste ? sammensetning : r.diff > 0 ? `${kr(r.diff)} dyrere over perioden (${Math.round((r.diff / p.utfall.resultat.kostnad) * 100)} %).` : 'Like billig.' }}
          </span>
        </button>
      </li>
    </ul>
    <p v-if="rader.some((r) => r.estimert)" class="mt-3 text-xs text-[var(--color-ink-3)]">
      * Estimat: regner med {{ p.utfall.prisokningProsent }} % prisøkning hver 1. februar.
    </p>
  </section>
</template>
