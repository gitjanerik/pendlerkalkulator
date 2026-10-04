<script setup>
import { computed } from 'vue'
import StasjonsChips from './StasjonsChips.vue'
import PrefBryter from './PrefBryter.vue'
import { PRESETS, strekningFraPreset } from '../lib/presets.js'
import { UKEDAGER_KORT } from '../lib/dagmonster.js'

const m = defineModel({ type: Object })
const valgt = computed(() => m.value.strekninger[0])
const bildag = (i) => {
  const s = new Set(m.value.bilUkedager)
  s.has(i) ? s.delete(i) : s.add(i)
  m.value.bilUkedager = [...s].sort()
}

const startAapen = !!m.value.andreRute
const harAndre = computed({
  get: () => Boolean(m.value.andreRute),
  set: (paa) => {
    if (!paa) {
      m.value.andreRute = null
      return
    }
    // Starter med en annen forhåndsvalgt strekning og siste jobbdag i uka.
    const annen = PRESETS.find((p) => p.id !== valgt.value?.id) ?? PRESETS[0]
    const siste = Math.max(...(m.value.jobbUkedager ?? [4]).filter((d) => d < 5), 4)
    m.value.andreRute = { strekning: strekningFraPreset(annen, annen.id), ukedager: [siste] }
  },
})
const andreDag = (i) => {
  const s = new Set(m.value.andreRute.ukedager)
  s.has(i) ? s.delete(i) : s.add(i)
  m.value.andreRute.ukedager = [...s].sort()
}
</script>

<template>
  <section aria-labelledby="st-tittel">
    <h3 id="st-tittel" class="seksjonstittel">Reiser fra</h3>
    <p class="mt-1 text-sm text-[var(--color-ink-2)]">Målet er Oslo S, og vi har priseksempler for åtte stasjoner. Andre strekninger legger du til selv.</p>
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

    <details class="mt-4 border-t border-[var(--color-line)] pt-1" :open="startAapen">
      <summary class="vis-pil min-h-11 font-medium text-[var(--color-ink)]">Avansert: annen strekning noen dager</summary>
      <PrefBryter v-model="harAndre" tittel="Annen strekning noen dager" tekst="Reiser du fra en annen stasjon eller til et annet sted enkelte ukedager? Hver strekning får egne billetter." />
      <div v-if="m.andreRute" class="mt-2">
        <StasjonsChips v-model="m" rute="b" />
        <p class="etikett mt-4" id="andre-dager">Ukedager på den andre strekningen</p>
        <div class="flex flex-wrap gap-2" role="group" aria-labelledby="andre-dager">
          <button v-for="(d, i) in UKEDAGER_KORT.slice(0, 5)" :key="d" type="button" class="chip" :aria-pressed="m.andreRute.ukedager.includes(i)" @click="andreDag(i)">{{ d }}</button>
        </div>
        <p class="mt-2 text-sm text-[var(--color-ink-2)]">
          <template v-if="!m.andreRute.ukedager.length">Velg minst én ukedag, ellers brukes bare den første strekningen.</template>
          <template v-else>Resten av jobbdagene bruker {{ valgt?.navn.split('–')[0] }}. Fritidsreiser og eksisterende billett gjelder den første strekningen.</template>
        </p>
      </div>
    </details>
  </section>
</template>
