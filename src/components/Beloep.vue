<script setup>
import { computed } from 'vue'

defineProps({ id: String, placeholder: String })
const modell = defineModel({ default: '' })

// Mellomrom som tusenskille (hardt, så beløpet ikke brytes) og bare hele kroner.
const vist = computed(() => (modell.value === '' || modell.value == null ? '' : String(Math.round(modell.value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')))
const skriv = (e) => {
  const siffer = e.target.value.replace(/\D/g, '')
  modell.value = siffer === '' ? '' : Number(siffer)
  e.target.value = vist.value
}
</script>

<template>
  <div class="relative">
    <input :id="id" class="felt !pl-10 text-right" type="text" inputmode="numeric" autocomplete="off" :placeholder="placeholder" :value="vist" @input="skriv" />
    <span aria-hidden="true" class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--color-ink-3)]">kr</span>
  </div>
</template>
