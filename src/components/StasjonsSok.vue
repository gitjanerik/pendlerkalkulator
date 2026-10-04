<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { sokStasjoner } from '../lib/entur.js'
import { MAKS_NAVN, rensStasjonsnavn } from '../lib/stasjoner.js'

// Stedsøk mot Entur. Navnet er bare gyldig når det er valgt fra listen, så skriver brukeren videre, nullstilles enturId.
const navn = defineModel('navn', { type: String, default: '' })
const enturId = defineModel('enturId', { type: String, default: '' })
const props = defineProps({
  id: { type: String, required: true },
  etikett: String,
  feil: String,
  // Melding som går foran søkestatusen, for eksempel resultatet av en sjekk etter valget.
  tilleggsstatus: String,
  // Navn som gjelder uten valg fra listen (Oslo S er standardmålet).
  standardNavn: String,
})
const emit = defineEmits(['valgt', 'endret'])

const forslag = ref([])
const status = ref('')
let stille = false
let tidtaker
let avbryt

const sok = async (tekst) => {
  avbryt?.abort()
  avbryt = new AbortController()
  try {
    const treff = await sokStasjoner(tekst, fetch, avbryt.signal)
    forslag.value = treff
    status.value = treff.length ? `${treff.length} ${treff.length === 1 ? 'stasjon' : 'stasjoner'} funnet. Velg en fra listen.` : 'Ingen stasjoner funnet. Prøv en annen skrivemåte.'
  } catch (e) {
    if (e.name === 'AbortError') return
    forslag.value = []
    status.value = 'Fikk ikke kontakt med Entur. Du må være på nett for å velge en stasjon.'
  }
}

watch(navn, (tekst) => {
  clearTimeout(tidtaker)
  if (stille) return
  if (enturId.value) {
    enturId.value = ''
    emit('endret')
  }
  const t = tekst.trim()
  if (t.length < 2) {
    avbryt?.abort()
    forslag.value = []
    status.value = ''
    return
  }
  tidtaker = setTimeout(() => sok(t), 300)
})

// Foreldre setter navnet utenfra (åpne skjema, velg standard) uten at det skal utløse søk.
const settUtenSok = (fn) => {
  stille = true
  fn()
  forslag.value = []
  status.value = ''
  clearTimeout(tidtaker)
  avbryt?.abort()
  queueMicrotask(() => (stille = false))
}

const velg = (f) => {
  stille = true
  navn.value = rensStasjonsnavn(f.navn)
  enturId.value = f.id
  forslag.value = []
  status.value = `${navn.value} valgt.`
  emit('valgt', f)
  queueMicrotask(() => setTimeout(() => (stille = false)))
}

onBeforeUnmount(() => {
  clearTimeout(tidtaker)
  avbryt?.abort()
})
defineExpose({ settUtenSok })
</script>

<template>
  <div>
    <label class="etikett" :for="id">{{ etikett }}</label>
    <input :id="id" v-model="navn" class="felt" type="text" autocomplete="off" :maxlength="MAKS_NAVN + 10" :aria-invalid="Boolean(feil)" :aria-describedby="feil ? `${id}-feil` : undefined" />
    <p v-if="feil" :id="`${id}-feil`" class="mt-1 text-sm text-[var(--color-bad)]">{{ feil }}</p>
    <p class="mt-1 text-sm text-[var(--color-ink-2)]" role="status">{{ tilleggsstatus || status || (enturId || (standardNavn && navn === standardNavn) ? `${navn} er valgt.` : 'Begynn å skrive, så foreslår Entur stasjoner.') }}</p>
    <ul v-if="forslag.length" class="mt-1 flex flex-col divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-edge)]" :aria-label="`Forslag fra Entur for ${etikett?.toLowerCase()}`">
      <li v-for="f in forslag" :key="f.id">
        <button type="button" class="flex min-h-11 w-full items-baseline justify-between gap-3 px-3 py-2 text-left hover:bg-[var(--color-app)]" @click="velg(f)">
          <span class="font-medium">{{ rensStasjonsnavn(f.navn) }}</span>
          <span v-if="f.sted" class="text-sm text-[var(--color-ink-2)]">{{ f.sted }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
