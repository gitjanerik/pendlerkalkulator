<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { PRESETS, strekningFraPreset } from '../lib/presets.js'
import { sokStasjoner } from '../lib/entur.js'
import { byggStasjon, MAKS_NAVN, MAKS_PRIS, nyStasjonsId, rensStasjonsnavn, skjemaFraStasjon, stasjonsnavn, tomtSkjema, validerStasjon } from '../lib/stasjoner.js'
import Beloep from './Beloep.vue'

const m = defineModel({ type: Object })
// I veiviseren kan brukeren legge til én egen stasjon; flere finnes i Innstillinger.
defineProps({ kunEn: Boolean })
const valgt = computed(() => m.value.strekninger[0])
const egne = computed(() => m.value.egneStasjoner ?? [])
const valgtEgen = computed(() => egne.value.find((e) => e.id === valgt.value?.id))

const modus = ref(null)
const redigerId = ref(null)
const skjema = reactive(tomtSkjema())
const feil = ref({})
const melding = ref('')
const leggTilKnapp = ref(null)
const redigerKnapp = ref(null)
const skjemaEl = ref(null)
const slettDlg = ref(null)

// Stedsøk mot Entur mens brukeren skriver. Navnet kan skrives fritt også, så appen virker uten nett.
const forslag = ref([])
const sokStatus = ref('')
let stille = true
let tidtaker
let avbryt
const sok = async (tekst) => {
  avbryt?.abort()
  avbryt = new AbortController()
  try {
    const treff = await sokStasjoner(tekst, fetch, avbryt.signal)
    forslag.value = treff
    sokStatus.value = treff.length ? `${treff.length} ${treff.length === 1 ? 'stasjon' : 'stasjoner'} funnet. Velg en fra listen.` : 'Ingen stasjoner funnet. Prøv en annen skrivemåte.'
  } catch (e) {
    if (e.name === 'AbortError') return
    forslag.value = []
    sokStatus.value = 'Fikk ikke kontakt med Entur. Du må være på nett for å legge til en stasjon.'
  }
}
watch(() => skjema.navn, (tekst) => {
  clearTimeout(tidtaker)
  if (stille || !modus.value) return
  // Skriver brukeren videre, er valget fra listen ikke lenger gyldig.
  skjema.enturId = ''
  const t = String(tekst).trim()
  if (t.length < 2) {
    avbryt?.abort()
    forslag.value = []
    sokStatus.value = ''
    return
  }
  tidtaker = setTimeout(() => sok(t), 300)
})
onBeforeUnmount(() => {
  clearTimeout(tidtaker)
  avbryt?.abort()
})
const velgForslag = async (f) => {
  stille = true
  skjema.navn = rensStasjonsnavn(f.navn)
  skjema.enturId = f.id
  forslag.value = []
  sokStatus.value = `${skjema.navn} valgt.`
  await nextTick()
  document.getElementById('st-enkelt')?.focus()
  stille = false
}

const FELT = [
  ['enkelt', 'Enkeltbillett'],
  ['lufthavn', 'Enkeltbillett til Oslo lufthavn (valgfritt)'],
  ['uke', 'Ukeskort (7 dager)'],
  ['maaned', 'Månedskort (30 dager)'],
  ['aar', 'Årskort (365 dager, valgfritt)'],
]
const feilListe = computed(() => Object.entries(feil.value))

const velgPreset = (p) => (m.value.strekninger = [strekningFraPreset(p, p.id)])
const velgEgen = (e) => (m.value.strekninger = [structuredClone(e)])

const aapne = async (nyModus) => {
  stille = true
  modus.value = nyModus
  feil.value = {}
  forslag.value = []
  sokStatus.value = ''
  Object.assign(skjema, nyModus === 'ny' ? tomtSkjema() : skjemaFraStasjon(valgtEgen.value))
  redigerId.value = nyModus === 'ny' ? null : valgtEgen.value.id
  await nextTick()
  stille = false
  skjemaEl.value?.querySelector('input')?.focus()
}
const lukk = async (tilbake) => {
  modus.value = null
  feil.value = {}
  forslag.value = []
  await nextTick()
  ;(tilbake?.value ?? leggTilKnapp.value)?.focus()
}
const lagre = async () => {
  feil.value = validerStasjon(skjema, egne.value, redigerId.value)
  if (feilListe.value.length) {
    await nextTick()
    skjemaEl.value?.querySelector('[aria-invalid="true"]')?.focus()
    return
  }
  const id = redigerId.value ?? nyStasjonsId(egne.value)
  const stasjon = byggStasjon(skjema, id)
  m.value.egneStasjoner = redigerId.value ? egne.value.map((e) => (e.id === id ? stasjon : e)) : [...egne.value, stasjon]
  velgEgen(stasjon)
  melding.value = `${redigerId.value ? 'Endret' : 'Lagt til'} stasjon: ${stasjonsnavn(stasjon)}.`
  await lukk(redigerKnapp)
}
const slett = async () => {
  const navn = stasjonsnavn(valgtEgen.value)
  const id = valgtEgen.value.id
  m.value.egneStasjoner = egne.value.filter((e) => e.id !== id)
  velgPreset(PRESETS[0])
  slettDlg.value.close()
  melding.value = `Slettet stasjon: ${navn}. ${stasjonsnavn(m.value.strekninger[0])} er valgt.`
  await lukk()
}
</script>

<template>
  <div>
    <div class="flex flex-wrap gap-2" role="group" aria-label="Hjemstasjon">
      <button v-for="p in PRESETS" :key="p.id" type="button" class="chip" :aria-pressed="valgt?.id === p.id" @click="velgPreset(p)">{{ stasjonsnavn(p) }}</button>
      <button v-for="e in egne" :key="e.id" type="button" class="chip" :aria-pressed="valgt?.id === e.id" @click="velgEgen(e)">{{ stasjonsnavn(e) }}</button>
      <button v-if="!(kunEn && egne.length)" ref="leggTilKnapp" type="button" class="chip" :aria-expanded="modus === 'ny'" aria-controls="stasjon-skjema" @click="modus === 'ny' ? lukk() : aapne('ny')">+ Egen stasjon</button>
    </div>
    <p class="sr-only" role="status">{{ melding }}</p>

    <div v-if="valgtEgen && !modus" class="mt-3 flex gap-2">
      <button ref="redigerKnapp" type="button" class="knapp" :aria-label="`Rediger ${stasjonsnavn(valgtEgen)}`" @click="aapne('rediger')">Rediger</button>
      <button type="button" class="knapp knapp-fare" :aria-label="`Slett ${stasjonsnavn(valgtEgen)}`" @click="slettDlg.showModal()">Slett</button>
    </div>

    <form v-if="modus" id="stasjon-skjema" ref="skjemaEl" class="mt-3 flex flex-col gap-3 rounded-xl border border-[var(--color-line)] p-3" novalidate @submit.prevent="lagre">
      <h4 class="font-semibold">{{ modus === 'ny' ? 'Ny stasjon' : `Rediger ${stasjonsnavn(valgtEgen)}` }}</h4>
      <p class="text-sm text-[var(--color-ink-2)]">Voksenpriser til Oslo S. Du kan finne dem i Vy- eller Ruter-appen.</p>
      <p v-if="feilListe.length" class="text-sm text-[var(--color-bad)]" role="alert">Rett {{ feilListe.length === 1 ? 'feltet' : 'feltene' }} med feil før du lagrer.</p>
      <div>
        <label class="etikett" for="st-navn">Søk etter stasjon</label>
        <input id="st-navn" v-model="skjema.navn" class="felt" type="text" autocomplete="off" :maxlength="MAKS_NAVN + 10" :aria-invalid="Boolean(feil.navn)" :aria-describedby="feil.navn ? 'st-navn-feil' : undefined" />
        <p v-if="feil.navn" id="st-navn-feil" class="mt-1 text-sm text-[var(--color-bad)]">{{ feil.navn }}</p>
        <p class="mt-1 text-sm text-[var(--color-ink-2)]" role="status">{{ sokStatus || skjema.enturId ? `${skjema.navn} er valgt.` : 'Begynn å skrive, så foreslår Entur stasjoner.' }}</p>
        <ul v-if="forslag.length" class="mt-1 flex flex-col divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-edge)]" aria-label="Forslag fra Entur">
          <li v-for="f in forslag" :key="f.id">
            <button type="button" class="flex min-h-11 w-full items-baseline justify-between gap-3 px-3 py-2 text-left hover:bg-[var(--color-app)]" @click="velgForslag(f)">
              <span class="font-medium">{{ rensStasjonsnavn(f.navn) }}</span>
              <span v-if="f.sted" class="text-sm text-[var(--color-ink-2)]">{{ f.sted }}</span>
            </button>
          </li>
        </ul>
      </div>
      <div class="grid grid-cols-2 items-end gap-3">
        <div v-for="[felt, navn] in FELT" :key="felt">
          <label class="etikett" :for="`st-${felt}`">{{ navn }}</label>
          <Beloep :id="`st-${felt}`" v-model="skjema[felt]" :ugyldig="Boolean(feil[felt])" :max="MAKS_PRIS[felt]" :feil-id="feil[felt] ? `st-${felt}-feil` : undefined" />
          <p v-if="feil[felt]" :id="`st-${felt}-feil`" class="mt-1 text-sm text-[var(--color-bad)]">{{ feil[felt] }}</p>
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <button type="button" class="knapp" @click="lukk(modus === 'ny' ? leggTilKnapp : redigerKnapp)">Avbryt</button>
        <button type="submit" class="knapp knapp-primaer">Lagre</button>
      </div>
    </form>

    <dialog ref="slettDlg" class="bekreft" aria-labelledby="sl-tittel" aria-describedby="sl-tekst">
      <div class="flex flex-col gap-3 p-5">
        <h2 id="sl-tittel" class="text-lg font-semibold">Slette {{ valgtEgen ? stasjonsnavn(valgtEgen) : 'stasjonen' }}?</h2>
        <p id="sl-tekst" class="text-[var(--color-ink-2)]">Stasjonen og prisene du la inn fjernes. Appen bytter til {{ stasjonsnavn(PRESETS[0]) }}.</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="knapp" autofocus @click="slettDlg.close()">Avbryt</button>
          <button type="button" class="knapp knapp-fare" @click="slett">Ja, slett</button>
        </div>
      </div>
    </dialog>
  </div>
</template>
