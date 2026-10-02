<script setup>
import { computed, ref } from 'vue'
import { flertall, kr } from '../lib/format.js'

const p = defineProps({ monster: Array, antall: Number })
const emit = defineEmits(['velg'])
const fokus = ref(null)

const maks = computed(() => Math.max(...p.monster.map((m) => m.kostnad ?? 0)) || 1)
const valgt = computed(() => p.monster.find((m) => m.antall === (fokus.value ?? p.antall)))
const naa = computed(() => p.monster.find((m) => m.antall === p.antall))
const tekst = computed(() => {
  const v = valgt.value
  if (!v?.kostnad) return ''
  if (!naa.value?.kostnad || v.antall === p.antall) return `${flertall(v.antall, 'dag', 'dager')} i uka: ${kr(v.kostnad)} (${kr(v.perMaaned)}/mnd).`
  const d = naa.value.kostnad - v.kostnad
  return `${flertall(v.antall, 'dag', 'dager')} i uka: ${kr(v.kostnad)} – ${d >= 0 ? `${kr(d)} billigere` : `${kr(-d)} dyrere`} enn nå.`
})
const sparing = computed(() => {
  const v = valgt.value
  const full = p.monster.find((m) => m.antall === 5)
  if (!v?.kostnad || !full?.kostnad) return ''
  if (v.antall === 5) return 'Full uke er sammenligningsgrunnlaget.'
  const d = full.kostnad - v.kostnad
  if (d <= 0) return `Full uke ville kostet ${kr(full.kostnad)}.`
  return `Full uke ville kostet ${kr(full.kostnad)} – du sparer ${kr(d)}.`
})
</script>

<template>
  <section class="kort" aria-labelledby="mg-tittel">
    <h2 id="mg-tittel" class="seksjonstittel">Spart med hjemmekontor</h2>
    <div class="@container mt-4 flex h-32 items-end gap-2" role="group" aria-label="Kostnad per antall jobbdager i uka">
      <button
        v-for="m in monster"
        :key="m.antall"
        type="button"
        class="flex h-full min-w-0 flex-1 flex-col justify-end gap-1 text-center"
        :aria-pressed="m.antall === antall"
        :aria-label="`${flertall(m.antall, 'dag', 'dager')} i uka, ${m.kostnad ? kr(m.kostnad) : 'ingen løsning'}`"
        @click="emit('velg', m.antall)"
        @mouseenter="fokus = m.antall"
        @mouseleave="fokus = null"
        @focus="fokus = m.antall"
        @blur="fokus = null"
      >
        <span class="text-xs tabular-nums text-[var(--color-ink-2)]" :class="m.antall === antall ? '' : '@max-[19rem]:hidden'">{{ m.kostnad ? Math.round(m.kostnad / 100) / 10 + 'k' : '–' }}</span>
        <span
          class="block w-full rounded-t-md"
          :class="m.antall === antall ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-bar)]'"
          :style="{ height: ((m.kostnad ?? 0) / maks) * 80 + '%' }"
        ></span>
      </button>
    </div>
    <div class="mt-1 flex gap-2" aria-hidden="true">
      <span v-for="m in monster" :key="m.antall" class="flex-1 text-center text-xs text-[var(--color-ink-3)]">{{ m.antall }}</span>
    </div>
    <p class="mt-3 text-sm text-[var(--color-ink-2)]" aria-live="polite">{{ tekst }}<span v-if="sparing" class="mt-1 block font-medium text-[var(--color-ink)]">{{ sparing }}</span></p>
  </section>
</template>
