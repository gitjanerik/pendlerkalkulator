<script setup>
import { kr } from '../lib/format.js'

defineProps({ utfall: Object })
</script>

<template>
  <section class="kort" aria-labelledby="ht-tittel">
    <h2 id="ht-tittel" class="seksjonstittel">Billigste løsning</h2>
    <p class="mt-2 text-5xl leading-none font-semibold tabular-nums">{{ kr(utfall.resultat.kostnad) }}</p>
    <p class="mt-2 text-[var(--color-ink-2)]">
      ca. <strong class="text-[var(--color-ink)]">{{ kr(utfall.perMaaned) }}</strong> i måneden
    </p>
    <p class="mt-3 text-sm text-[var(--color-ink-2)]">
      {{ utfall.oppsummering.turer }} reiser på {{ utfall.oppsummering.reisedager }} dager ·
      {{ utfall.resultat.billetter.length }} periodebilletter
      <template v-if="utfall.resultat.udekteDager.length"> + {{ utfall.resultat.udekteDager.length }} dager med enkeltbillett</template>
    </p>
  </section>
</template>
