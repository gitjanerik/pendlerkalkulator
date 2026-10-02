<script setup>
defineProps({ tittel: String, tekst: String })
const modell = defineModel({ type: Boolean })
</script>

<template>
  <label class="flex min-h-11 cursor-pointer items-start justify-between gap-4 py-2">
    <span>
      <span class="block font-medium">{{ tittel }}</span>
      <span v-if="tekst" class="block text-sm text-[var(--color-ink-2)]">{{ tekst }}</span>
    </span>
    <input v-model="modell" type="checkbox" role="switch" class="peer sr-only" />
    <span
      aria-hidden="true"
      class="relative mt-0.5 h-7 w-12 shrink-0 rounded-full bg-[var(--color-line)] transition-colors after:absolute after:top-1 after:left-1 after:h-5 after:w-5 after:rounded-full after:bg-[var(--color-surface)] after:shadow after:transition-transform peer-checked:bg-[var(--color-accent)] peer-checked:after:translate-x-5 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-accent)]"
    ></span>
  </label>
</template>
