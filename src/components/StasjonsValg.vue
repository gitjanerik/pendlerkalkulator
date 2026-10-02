<script setup>
import { computed } from 'vue'
import { PRESETS, strekningFraPreset } from '../lib/presets.js'
import { UKEDAGER_KORT } from '../lib/dagmonster.js'

const m = defineModel({ type: Object })
const valgt = computed(() => m.value.strekninger[0])
const kort = (p) => p.navn.split('–')[0]

const velg = (p) => {
  m.value.strekninger = [strekningFraPreset(p, p.id)]
}
const bildag = (i) => {
  const s = new Set(m.value.bilUkedager)
  s.has(i) ? s.delete(i) : s.add(i)
  m.value.bilUkedager = [...s].sort()
}
</script>

<template>
  <section aria-labelledby="st-tittel">
    <h3 id="st-tittel" class="seksjonstittel">Reiser til Oslo S fra</h3>
    <div class="mt-3 flex flex-wrap gap-2">
      <button
        v-for="p in PRESETS"
        :key="p.id"
        type="button"
        class="chip"
        :aria-pressed="valgt?.id === p.id"
        @click="velg(p)"
      >
        {{ kort(p) }}
      </button>
    </div>
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
