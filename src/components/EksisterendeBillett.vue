<script setup>
import { leggTilDager } from '../lib/dato.js'

const m = defineModel({ type: Object })
const TYPER = [
  ['uke', 'Ukeskort'],
  ['maaned', 'Månedskort'],
  ['aar', 'Årskort'],
]
const sett = (paa) => {
  m.value.eksisterende.paa = paa
  if (paa && !m.value.eksisterende.til) m.value.eksisterende.til = leggTilDager(m.value.fra, 14)
}
</script>

<template>
  <div>
    <div class="flex gap-2" role="group" aria-label="Har du en periodebillett nå?">
      <button type="button" class="chip flex-1" :aria-pressed="!m.eksisterende.paa" @click="sett(false)">Nei</button>
      <button type="button" class="chip flex-1" :aria-pressed="m.eksisterende.paa" @click="sett(true)">Ja</button>
    </div>
    <div v-if="m.eksisterende.paa" class="mt-4 flex flex-col gap-3">
      <div class="flex flex-wrap gap-2" role="group" aria-label="Type billett">
        <button v-for="[id, navn] in TYPER" :key="id" type="button" class="chip" :aria-pressed="m.eksisterende.type === id" @click="m.eksisterende.type = id">{{ navn }}</button>
      </div>
      <p class="etikett !mb-0">Når utløper billetten?</p>
      <div class="grid grid-cols-2 gap-3">
        <input v-model="m.eksisterende.til" class="felt" type="date" aria-label="Utløpsdato" />
        <input v-model="m.eksisterende.klokke" class="felt" type="time" aria-label="Utløpsklokkeslett" />
      </div>
      <p class="text-sm text-[var(--color-ink-2)]">Beregningen starter når billetten din utløper. Vi foreslår aldri ny billett rett etter utløp, men ved neste arbeidsreise. Gjelder billetten til fredag ettermiddag, starter den nye for eksempel mandag morgen.</p>
    </div>
  </div>
</template>
