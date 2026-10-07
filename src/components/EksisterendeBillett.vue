<script setup>
import { watch } from 'vue'
import { idagIso, leggTilDager } from '../lib/dato.js'

const m = defineModel({ type: Object })
const TYPER = [
  ['uke', 'Ukeskort'],
  ['maaned', 'Månedskort'],
  ['aar', 'Årskort'],
]
const VARIGHET = { uke: 7, maaned: 30, aar: 365 }
const idag = idagIso()
const maksDato = () => leggTilDager(idag, VARIGHET[m.value.eksisterende.type] ?? 365)
const sett = (paa) => {
  m.value.eksisterende.paa = paa
  if (paa && !m.value.eksisterende.til) m.value.eksisterende.til = leggTilDager(idag, Math.min(14, VARIGHET[m.value.eksisterende.type]))
}

// Billetten kan ikke gjelde lenger frem enn typens varighet, og beregningen starter først når den utløper.
watch(
  () => [m.value.eksisterende.paa, m.value.eksisterende.type, m.value.eksisterende.til],
  () => {
    const e = m.value.eksisterende
    if (!e.paa || !e.til) return
    if (e.til > maksDato()) e.til = maksDato()
    if (e.til > m.value.fra) m.value.fra = e.til
  },
  { immediate: true },
)
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
      <p id="eb-utloper" class="etikett !mb-0">Når utløper billetten?</p>
      <div class="felt-par" role="group" aria-labelledby="eb-utloper">
        <input v-model="m.eksisterende.til" class="felt" type="date" aria-label="Utløpsdato" :min="idag" :max="maksDato()" />
        <input v-model="m.eksisterende.klokke" class="felt" type="time" aria-label="Utløpsklokkeslett" />
      </div>
      <details class="text-sm text-[var(--color-ink-2)]">
        <summary class="vis-pil min-h-11 py-2 font-medium">Når starter den nye billetten?</summary>
        <p>Beregningen starter når billetten din utløper. Vi foreslår aldri ny billett rett etter utløp, men ved neste arbeidsreise. Gjelder billetten til fredag ettermiddag, starter den nye for eksempel mandag morgen. Vi tar også høyde for hvilke arbeidsdager du har valgt.</p>
      </details>
    </div>
  </div>
</template>
