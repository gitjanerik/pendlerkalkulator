<script setup>
import { computed } from 'vue'
import { MONSTER, UKEDAGER_KORT, UKEDAGER_LANG } from '../lib/dagmonster.js'

const m = defineModel({ type: Object })
const antall = computed(() => m.value.jobbUkedager.length)

const sett = (n) => {
  m.value.jobbUkedager = [...MONSTER[n]]
}
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
      <output class="text-2xl font-semibold tabular-nums" for="dp-slider">{{ antall }}</output>
    </div>
    <input
      id="dp-slider"
      type="range"
      min="1"
      max="5"
      step="1"
      :value="antall"
      :aria-valuetext="tekst"
      aria-labelledby="dp-tittel"
      @input="sett(Number($event.target.value))"
    />
    <div class="flex justify-between px-1 text-xs text-[var(--color-ink-3)]" aria-hidden="true">
      <span v-for="n in 5" :key="n">{{ n }}</span>
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
    <p class="mt-2 text-sm text-[var(--color-ink-2)]">Resten regnes som hjemmekontor.</p>
  </section>
</template>
