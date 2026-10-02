<script setup>
import { kr, norskTidspunkt } from '../lib/format.js'

defineProps({ billett: Object, nr: Number })
</script>

<template>
  <li class="relative pl-8">
    <span
      aria-hidden="true"
      class="absolute top-1 left-0 grid h-6 w-6 place-items-center rounded-full bg-[var(--color-accent)] text-xs font-semibold text-[var(--color-app)]"
      >{{ nr }}</span
    >
    <div class="kort">
      <div class="flex items-baseline justify-between gap-3">
        <h3 class="text-lg font-semibold">{{ billett.dager }} dager</h3>
        <p class="text-lg font-semibold tabular-nums">{{ kr(billett.pris) }}</p>
      </div>
      <p class="text-sm text-[var(--color-ink-2)]">{{ billett.strekningNavn }}</p>
      <dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt class="text-[var(--color-ink-2)]">Aktiver</dt>
        <dd class="font-medium">{{ norskTidspunkt(billett.aktivering) }}</dd>
        <dt class="text-[var(--color-ink-2)]">Utløper</dt>
        <dd>{{ norskTidspunkt(billett.utloper) }}</dd>
        <dt class="text-[var(--color-ink-2)]">Dekker</dt>
        <dd>{{ billett.antallTurer }} reiser</dd>
      </dl>
      <ul class="mt-3 flex flex-wrap gap-2 text-xs font-medium">
        <li
          v-if="billett.passPaa"
          class="rounded-full border border-[var(--color-warn)] px-2.5 py-1 text-[var(--color-warn)]"
        >
          {{
            billett.marginMin === 0
              ? 'Siste reise går akkurat ved utløp'
              : `Siste reise ${billett.marginMin} min før utløp`
          }}
        </li>
        <li
          v-if="billett.bindende"
          class="rounded-full border border-[var(--color-bad)] px-2.5 py-1 text-[var(--color-bad)]"
        >
          Binder deg i 12 måneder
        </li>
      </ul>
    </div>
  </li>
</template>
