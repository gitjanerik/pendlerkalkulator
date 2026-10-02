<script setup>
import { flertall, kr } from '../lib/format.js'

defineProps({ utfall: Object })
</script>

<template>
  <section class="kort" aria-labelledby="ht-tittel">
    <h2 id="ht-tittel" class="seksjonstittel">Billigste løsning</h2>
    <p class="mt-2 text-[clamp(1.75rem,11vw,3rem)] leading-tight font-semibold tabular-nums break-words">{{ kr(utfall.resultat.kostnad) }}</p>
    <p class="mt-2 text-[var(--color-ink-2)]">
      ca. <strong class="text-[var(--color-ink)]">{{ kr(utfall.perMaaned) }}</strong> i måneden
    </p>
    <p class="mt-3 text-sm text-[var(--color-ink-2)]">
      {{ flertall(utfall.oppsummering.turer, 'reise', 'reiser') }} på {{ flertall(utfall.oppsummering.reisedager, 'dag', 'dager') }} ·
      {{ flertall(utfall.resultat.billetter.length, 'periodebillett', 'periodebilletter') }}
      <template v-if="utfall.resultat.udekteDager.length"> + {{ flertall(utfall.resultat.udekteDager.length, 'dag', 'dager') }} med enkeltbillett</template>
    </p>
    <p v-if="utfall.fritid" class="mt-2 text-sm text-[var(--color-ink-2)]">
      Med {{ flertall(utfall.fritid.reiser.length, 'fritidsreise', 'fritidsreiser') }} til Oslo lufthavn ({{ kr(utfall.fritid.sum) }} i tillegg).
    </p>
    <p v-if="utfall.resultat.reis" class="mt-2 text-sm text-[var(--color-ink-2)]">
      Ruter Reis sparer {{ kr(utfall.resultat.reis.besparelse) }} på {{ flertall(utfall.resultat.reis.enkeltreiser, 'enkeltreise', 'enkeltreiser') }} (opptil {{ utfall.resultat.reis.maksProsent }} %).
    </p>
  </section>
</template>
