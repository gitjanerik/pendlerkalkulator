<script setup>
import { useId } from 'vue'

defineProps({ tittel: String, tekst: String })
const modell = defineModel({ type: Boolean })
const id = useId()
</script>

<template>
  <label class="flex min-h-11 cursor-pointer items-start justify-between gap-3 py-2">
    <span class="min-w-0">
      <span :id="`${id}-t`" class="block font-medium break-words">{{ tittel }}</span>
      <span v-if="tekst" :id="`${id}-b`" class="block text-sm break-words text-[var(--color-ink-2)]">{{ tekst }}</span>
    </span>
    <!-- Navnet er tittelen alene; forklaringen leses som beskrivelse. -->
    <input v-model="modell" type="checkbox" role="switch" class="sr-only" :aria-labelledby="`${id}-t`" :aria-describedby="tekst ? `${id}-b` : undefined" />
    <span aria-hidden="true" class="bryter"></span>
  </label>
</template>
