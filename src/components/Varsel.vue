<script setup>
defineProps({ lukkbar: Boolean, rolle: { type: String, default: 'status' } })
defineEmits(['lukk'])
</script>

<template>
  <div class="varsel" :role="rolle">
    <svg viewBox="0 0 24 24" class="mt-0.5 h-5 w-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l10 18H2L12 3zM12 10v5M12 18v.01" /></svg>
    <div class="min-w-0 flex-1 text-sm"><slot /></div>
    <button v-if="lukkbar" type="button" class="varsel-lukk" aria-label="Lukk varselet" @click="$emit('lukk')">
      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
  </div>
</template>
