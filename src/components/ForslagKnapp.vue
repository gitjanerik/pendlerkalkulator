<script setup>
import { ref } from 'vue'
import { foreslaaAvganger } from '../lib/entur.js'
import { stasjonsId } from '../composables/useAvganger.js'
import { idagIso } from '../lib/dato.js'

const m = defineModel({ type: Object })
const props = defineProps({ stasjon: { type: String, required: true }, maal: { type: String, default: 'Oslo S' } })
const laster = ref(false)
const melding = ref('')

async function foreslaa() {
  if (laster.value) return
  laster.value = true
  melding.value = ''
  try {
    const [hjem, oslo] = await Promise.all([stasjonsId(props.stasjon), stasjonsId(props.maal)])
    const f = await foreslaaAvganger(hjem, oslo, idagIso(), { morgen: m.value.morgen, ettermiddag: m.value.ettermiddag })
    if (f.morgen) m.value.morgen = f.morgen
    if (f.ettermiddag) m.value.ettermiddag = f.ettermiddag
    if (!f.morgen || !f.ettermiddag) melding.value = 'Fant ikke alle avgangene. Fyll inn tidene selv.'
  } catch {
    melding.value = 'Fikk ikke kontakt med Entur. Sjekk nettforbindelsen, eller fyll inn tidene selv.'
  } finally {
    laster.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- aria-disabled i stedet for disabled, så fokus blir stående mens det lastes. -->
    <button type="button" class="chip self-start px-3 aria-disabled:opacity-60" :aria-disabled="laster" @click="foreslaa">
      {{ laster ? 'Henter tider …' : 'Foreslå tider fra Entur' }}
    </button>
    <p v-if="melding" class="text-sm" role="status">{{ melding }}</p>
  </div>
</template>
