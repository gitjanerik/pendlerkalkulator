<script setup>
import { ref } from 'vue'
import { foreslaaAvganger } from '../lib/entur.js'
import { stasjonsId } from '../composables/useAvganger.js'
import { idagIso } from '../lib/dato.js'

const m = defineModel({ type: Object })
const props = defineProps({ stasjon: { type: String, required: true }, hint: { type: Boolean, default: true } })
const laster = ref(false)
const melding = ref('')

async function foreslaa() {
  laster.value = true
  melding.value = ''
  try {
    const [hjem, oslo] = await Promise.all([stasjonsId(props.stasjon), stasjonsId('Oslo S')])
    const f = await foreslaaAvganger(hjem, oslo, idagIso(), { morgen: m.value.morgen, ettermiddag: m.value.ettermiddag })
    if (f.morgen) m.value.morgen = f.morgen
    if (f.ettermiddag) m.value.ettermiddag = f.ettermiddag
    melding.value = f.morgen && f.ettermiddag ? 'Avgangene er fylt inn.' : 'Fant ikke alle avgangene. Fyll inn selv.'
  } catch {
    melding.value = 'Fikk ikke kontakt med Entur. Fyll inn selv.'
  } finally {
    laster.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <button type="button" class="chip self-start px-3" :disabled="laster" @click="foreslaa">
      {{ laster ? 'Henter …' : 'Foreslå fra Entur' }}
    </button>
    <p v-if="hint" class="text-sm text-[var(--color-ink-3)]">Første tog fra klokkeslettene du har valgt, til og fra Oslo S.</p>
    <p v-if="melding" class="text-sm" role="status">{{ melding }}</p>
  </div>
</template>
