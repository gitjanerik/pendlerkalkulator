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
const tittel = computed(() =>
  antall.value === 5 ? 'Full pendleruke' : antall.value === 1 ? '1 dag pendling i uka' : `${antall.value} dager pendling`,
)
</script>

<template>
  <section class="kort" aria-labelledby="dp-tittel">
    <h2 id="dp-tittel" class="seksjonstittel" aria-live="polite">{{ tittel }}</h2>
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
