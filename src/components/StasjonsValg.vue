<script setup>
import { computed } from 'vue'
import StasjonsChips from './StasjonsChips.vue'
import { UKEDAGER_KORT } from '../lib/dagmonster.js'

const m = defineModel({ type: Object })
const valgt = computed(() => m.value.strekninger[0])
const bildag = (i) => {
  const s = new Set(m.value.bilUkedager)
  s.has(i) ? s.delete(i) : s.add(i)
  m.value.bilUkedager = [...s].sort()
}
</script>

<template>
  <section aria-labelledby="st-tittel">
    <h3 id="st-tittel" class="seksjonstittel">Reiser til Oslo S fra</h3>
    <StasjonsChips v-model="m" class="mt-3" />
    <div v-if="valgt?.bil" class="mt-4">
      <p class="etikett">Dager du kjører bil i stedet</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="(d, i) in UKEDAGER_KORT"
          :key="d"
          type="button"
          class="chip"
          :aria-pressed="m.bilUkedager.includes(i)"
          @click="bildag(i)"
        >
          {{ d }}
        </button>
      </div>
    </div>
  </section>
</template>
