<script setup>
import { computed, useId } from 'vue'

// Med max blir feltet et vanlig tallfelt med min og max; ellers er det tekst med tusenskille.
defineProps({ id: String, placeholder: String, ugyldig: Boolean, feilId: String, min: Number, max: Number })
const modell = defineModel({ default: '' })
const enhet = useId()

// Mellomrom som tusenskille (hardt, så beløpet ikke brytes) og bare hele kroner.
const vist = computed(() => (modell.value === '' || modell.value == null ? '' : String(Math.round(modell.value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')))
const skrivTall = (e) => {
  modell.value = e.target.value === '' ? '' : Number(e.target.value)
}
const skriv = (e) => {
  const siffer = e.target.value.replace(/\D/g, '')
  modell.value = siffer === '' ? '' : Number(siffer)
  e.target.value = vist.value
}
</script>

<template>
  <div class="relative">
    <input v-if="max" :id="id" class="felt !pl-10 text-right" type="number" inputmode="numeric" step="1" :min="min ?? 1" :max="max" autocomplete="off" :aria-invalid="ugyldig || undefined" :aria-describedby="feilId ? `${enhet} ${feilId}` : enhet" :placeholder="placeholder" :value="modell" @input="skrivTall" />
    <input v-else :id="id" class="felt !pl-10 text-right" type="text" inputmode="numeric" autocomplete="off" :aria-invalid="ugyldig || undefined" :aria-describedby="feilId ? `${enhet} ${feilId}` : enhet" :placeholder="placeholder" :value="vist" @input="skriv" />
    <span aria-hidden="true" class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--color-ink-3)]">kr</span>
    <span :id="enhet" class="sr-only">Beløp i kroner</span>
  </div>
</template>
