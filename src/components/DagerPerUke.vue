<script setup>
import { computed } from 'vue'
import { UKEDAGER_KORT, UKEDAGER_LANG } from '../lib/dagmonster.js'

const m = defineModel({ type: Object })
const antall = computed(() => m.value.jobbUkedager.length)

const veksle = (i) => {
  const s = new Set(m.value.jobbUkedager)
  if (s.has(i)) {
    if (s.size === 1) return // minst én jobbdag
    s.delete(i)
  } else s.add(i)
  m.value.jobbUkedager = [...s].sort()
}
const tekst = computed(() =>
  antall.value === 5 ? 'Alle ukedager på jobb' : `${antall.value} av 5 dager på jobb`,
)
</script>

<template>
  <section class="kort" aria-labelledby="dp-tittel">
    <div class="flex items-baseline justify-between gap-3">
      <h2 id="dp-tittel" class="seksjonstittel">Dager på jobb i uka</h2>
      <output class="text-2xl font-semibold tabular-nums" :aria-label="tekst">{{ antall }}</output>
    </div>
    <div class="mt-3 flex flex-wrap gap-2" role="group" aria-label="Hvilke dager er du på jobb?">
      <button
        v-for="(d, i) in UKEDAGER_KORT"
        :key="d"
        type="button"
        class="chip"
        :aria-pressed="m.jobbUkedager.includes(i)"
        :aria-label="UKEDAGER_LANG[i]"
        @click="veksle(i)"
      >
        {{ d }}
      </button>
    </div>
  </section>
</template>
