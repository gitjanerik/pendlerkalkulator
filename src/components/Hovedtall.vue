<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { flertall, kr } from '../lib/format.js'
import Estimat from './Estimat.vue'

const p = defineProps({ utfall: Object })

// Tallet står langt unna det brukeren endrer. Etter en kort pause sier en stille
// statusmelding fra om det nye resultatet, så skjermlesere ikke går glipp av det.
const kunngjoring = ref('')
const sammendrag = computed(() => `Billigste løsning: ${kr(p.utfall.perMaaned)} i måneden, ca. ${kr(p.utfall.resultat.kostnad)} i perioden.`)
let tidtaker
watch(sammendrag, (tekst) => {
  clearTimeout(tidtaker)
  tidtaker = setTimeout(() => (kunngjoring.value = tekst), 800)
})
onBeforeUnmount(() => clearTimeout(tidtaker))
</script>

<template>
  <section class="kort hero" aria-labelledby="ht-tittel">
    <h2 id="ht-tittel" class="text-sm font-semibold tracking-wide text-[var(--color-accent-text)]">Beregnet kostnad</h2>
    <p class="hero-tall mt-2 text-[clamp(2.5rem,15vw,4.25rem)] leading-none font-extrabold tracking-tight tabular-nums break-words">{{ kr(utfall.perMaaned) }}<Estimat v-if="utfall.resultat.estimert" /><span class="mt-1 block text-lg font-medium tracking-normal text-[var(--color-ink-2)]">i måneden</span></p>
    <p class="mt-3 text-lg text-[var(--color-ink-2)]">
      ca. <strong class="text-[var(--color-ink)]">{{ kr(utfall.resultat.kostnad) }}</strong><Estimat v-if="utfall.resultat.estimert" /> i perioden
    </p>
    <p class="sr-only" role="status">{{ kunngjoring }}</p>
    <p class="mt-3 text-sm text-[var(--color-ink-2)]">
      {{ flertall(utfall.oppsummering.turer, 'reise', 'reiser') }} på {{ flertall(utfall.oppsummering.reisedager, 'dag', 'dager') }} ·
      {{ flertall(utfall.resultat.billetter.length, 'periodebillett', 'periodebilletter') }}
      <template v-if="utfall.resultat.udekteDager.length"> + {{ flertall(utfall.resultat.udekteDager.length, 'dag', 'dager') }} med enkeltbillett</template>
    </p>
    <p v-if="utfall.fritid" class="mt-2 text-sm text-[var(--color-ink-2)]">
      Med {{ flertall(utfall.fritid.reiser.length, 'fritidsreise', 'fritidsreiser') }} til Oslo lufthavn ({{ kr(utfall.fritid.sum) }}<Estimat v-if="utfall.fritid.estimert" /> i tillegg).
    </p>
    <p v-if="utfall.resultat.reis" class="mt-2 text-sm text-[var(--color-ink-2)]">
      Ruter Reis sparer {{ kr(utfall.resultat.reis.besparelse) }} på {{ flertall(utfall.resultat.reis.enkeltreiser, 'enkeltreise', 'enkeltreiser') }} (opptil {{ utfall.resultat.reis.maksProsent }} %).
    </p>
    <p v-if="utfall.resultat.estimert" class="mt-3 text-sm text-[var(--color-ink-3)]">
      * Estimat: antar {{ utfall.prisokningProsent }} % årlig prisøkning rundt 1. februar.
    </p>
  </section>
</template>

<style scoped>
.hero {
  background:
    radial-gradient(28rem 14rem at 100% 0%, color-mix(in srgb, var(--color-accent) 16%, transparent), transparent 70%),
    var(--color-surface);
  border-color: color-mix(in srgb, var(--color-accent) 35%, var(--color-line));
}
.hero-tall {
  color: var(--color-accent-text);
}
@media (forced-colors: active) {
  .hero {
    border-color: ButtonText;
  }
}
</style>
