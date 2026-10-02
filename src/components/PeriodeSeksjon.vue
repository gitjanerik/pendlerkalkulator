<script setup>
import { computed } from 'vue'
import { UKEDAG_NAVN } from '../lib/format.js'

const m = defineModel({ type: Object })
const harBil = computed(() => m.value.strekninger.some((s) => s.bil))

const veksleUkedag = (nr) => {
  const sett = new Set(m.value.bilUkedager)
  sett.has(nr) ? sett.delete(nr) : sett.add(nr)
  m.value.bilUkedager = [...sett].sort()
}
</script>

<template>
  <section aria-labelledby="periode" class="kort flex flex-col gap-4">
    <h2 id="periode" class="text-xl font-semibold">Periode og reisetider</h2>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="etikett" for="fra">Fra</label>
        <input id="fra" v-model="m.fra" class="felt" type="date" />
      </div>
      <div>
        <label class="etikett" for="til">Til</label>
        <input id="til" v-model="m.til" class="felt" type="date" />
      </div>
      <div class="col-span-2">
        <label class="etikett" for="fra-klokke">Første reise starter kl.</label>
        <input id="fra-klokke" v-model="m.fraKlokke" class="felt" type="time" />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="etikett" for="morgen">Avreise morgen</label>
        <input id="morgen" v-model="m.morgen" class="felt" type="time" />
      </div>
      <div>
        <label class="etikett" for="ettermiddag">Avreise ettermiddag</label>
        <input id="ettermiddag" v-model="m.ettermiddag" class="felt" type="time" />
      </div>
    </div>

    <div>
      <label class="etikett" for="retninger">Reiser</label>
      <select id="retninger" v-model="m.retninger" class="felt">
        <option value="begge">Begge veier</option>
        <option value="morgen">Bare morgenreisen</option>
        <option value="ettermiddag">Bare ettermiddagsreisen</option>
      </select>
    </div>

    <div v-if="harBil">
      <p class="etikett">Dager du har bil</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="(navn, nr) in UKEDAG_NAVN.slice(0, 5)"
          :key="nr"
          type="button"
          class="chip"
          :aria-pressed="m.bilUkedager.includes(nr)"
          @click="veksleUkedag(nr)"
        >
          {{ navn }}
        </button>
      </div>
    </div>
  </section>
</template>
