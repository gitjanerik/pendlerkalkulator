<script setup>
import { computed, ref } from 'vue'
import { UKEDAGER_KORT, UKEDAGER_LANG } from '../lib/dagmonster.js'

const m = defineModel({ type: Object })
const antall = computed(() => m.value.jobbUkedager.length)
const melding = ref('')

const veksle = (i) => {
  const s = new Set(m.value.jobbUkedager)
  if (s.has(i)) {
    if (s.size === 1) {
      melding.value = 'Du må ha minst én dag valgt. Velg en annen dag først.'
      return
    }
    s.delete(i)
  } else s.add(i)
  melding.value = ''
  m.value.jobbUkedager = [...s].sort()
}
const tittel = computed(() =>
  antall.value === 5 ? 'Full pendleruke' : antall.value === 1 ? '1 dag pendling i uka' : `${antall.value} dager pendling i uka`,
)
</script>

<template>
  <section class="kort" aria-labelledby="dp-tittel">
    <h2 id="dp-tittel" class="seksjonstittel">{{ tittel }}</h2>
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
    <p class="text-sm text-[var(--color-ink-2)]" :class="{ 'mt-2': melding }" role="status">{{ melding }}</p>
  </section>
</template>
