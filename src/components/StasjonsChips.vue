<script setup>
import { computed, nextTick, reactive, ref } from 'vue'
import { PRESETS, strekningFraPreset } from '../lib/presets.js'
import { flyplassBakOsloS } from '../lib/entur.js'
import { byggStasjon, MAKS_PRIS, nyStasjonsId, OSLO_S, skjemaFraStasjon, stasjonsnavn, strekningsvalg, tomtSkjema, validerStasjon } from '../lib/stasjoner.js'
import StasjonsSok from './StasjonsSok.vue'
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
const fraSok = ref(null)
const tilSok = ref(null)
const flyStatus = ref('')
const tilOslo = computed(() => skjema.til.trim().toLowerCase() === OSLO_S.toLowerCase())
const slettDlg = ref(null)

// Ligger flyplassen før eller bak Oslo S på reisen? Uten svar regner vi som bak (vanlig fra sør).
const sjekker = ref(false)
let sjekkId = 0
const sjekkFlyplass = async (id) => {
  const mitt = ++sjekkId
  sjekker.value = true
  skjema.bakOsloS = null
  try {
    const bak = await flyplassBakOsloS(id)
    if (mitt !== sjekkId) return
    skjema.bakOsloS = bak
    flyStatus.value = bak === false
      ? `${skjema.navn} er valgt. Flyplassen ligger før Oslo S på din reise, så fyll inn prisen på billett til Oslo lufthavn.`
      : `${skjema.navn} er valgt.`
  } catch {
    if (mitt === sjekkId) flyStatus.value = `${skjema.navn} er valgt, men vi kunne ikke sjekke veien til flyplassen. Vi regner med at den ligger bak Oslo S.`
  } finally {
    if (mitt === sjekkId) sjekker.value = false
  }
}
const fraValgt = async (f) => {
  flyStatus.value = `${f.navn} valgt. Sjekker veien til flyplassen …`
  if (tilOslo.value) sjekkFlyplass(f.id)
  await nextTick()
  document.getElementById('st-til')?.focus()
}
const tilValgt = async () => {
  if (tilOslo.value && skjema.enturId && skjema.bakOsloS === null) sjekkFlyplass(skjema.enturId)
  await nextTick()
  document.getElementById('st-enkelt')?.focus()
}
// Fra-valget fjernes når brukeren skriver videre, og da gjelder ikke sjekken lenger.
const fraEndret = () => {
  skjema.bakOsloS = null
  flyStatus.value = ''
  sjekkId++
  sjekker.value = false
}
const FELT = [
  ['enkelt', 'Enkeltbillett'],
  ['lufthavn', 'Enkeltbillett til Oslo lufthavn'],
  ['uke', 'Ukeskort (7 dager)'],
  ['maaned', 'Månedskort (30 dager)'],
  ['aar', 'Årskort (365 dager, valgfritt)'],
]
const feilListe = computed(() => Object.entries(feil.value))

const velgPreset = (p) => (m.value.strekninger = [strekningFraPreset(p, p.id)])
const velgEgen = (e) => (m.value.strekninger = [structuredClone(e)])

const aapne = async (nyModus) => {
  modus.value = nyModus
  feil.value = {}
  flyStatus.value = ''
  sjekkId++
  sjekker.value = false
  await nextTick()
  const fyll = () => Object.assign(skjema, nyModus === 'ny' ? tomtSkjema() : skjemaFraStasjon(valgtEgen.value))
  fraSok.value.settUtenSok(() => tilSok.value.settUtenSok(fyll))
  redigerId.value = nyModus === 'ny' ? null : valgtEgen.value.id
  await nextTick()
  skjemaEl.value?.querySelector('input')?.focus()
}
const lukk = async (tilbake) => {
  modus.value = null
  feil.value = {}
  await nextTick()
  ;(tilbake?.value ?? leggTilKnapp.value)?.focus()
}
const lagre = async () => {
  // Er målet Oslo S først etter at fra-stasjonen ble valgt, mangler sjekken av flyplassen.
  if (tilOslo.value && skjema.enturId && skjema.bakOsloS === null && !sjekker.value) await sjekkFlyplass(skjema.enturId)
  if (sjekker.value) {
    flyStatus.value = 'Vent et øyeblikk, vi sjekker veien til flyplassen.'
    return
  }
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
  melding.value = `${redigerId.value ? 'Endret' : 'Lagt til'} strekning: ${strekningsvalg(stasjon)}.`
  await lukk(redigerKnapp)
}
const slett = async () => {
  const navn = strekningsvalg(valgtEgen.value)
  const id = valgtEgen.value.id
  m.value.egneStasjoner = egne.value.filter((e) => e.id !== id)
  velgPreset(PRESETS[0])
  slettDlg.value.close()
  melding.value = `Slettet strekning: ${navn}. ${strekningsvalg(m.value.strekninger[0])} er valgt.`
  await lukk()
}
</script>

<template>
  <div>
    <div class="flex flex-wrap gap-2" role="group" aria-label="Strekning">
      <button v-for="p in PRESETS" :key="p.id" type="button" class="chip" :aria-pressed="valgt?.id === p.id" @click="velgPreset(p)">{{ strekningsvalg(p) }}</button>
      <button v-for="e in egne" :key="e.id" type="button" class="chip" :aria-pressed="valgt?.id === e.id" @click="velgEgen(e)">{{ strekningsvalg(e) }}</button>
      <button v-if="!(kunEn && egne.length)" ref="leggTilKnapp" type="button" class="chip" :aria-expanded="modus === 'ny'" aria-controls="stasjon-skjema" @click="modus === 'ny' ? lukk() : aapne('ny')">+ Egen strekning</button>
    </div>
    <p class="sr-only" role="status">{{ melding }}</p>

    <div v-if="valgtEgen && !modus" class="mt-3 flex gap-2">
      <button ref="redigerKnapp" type="button" class="knapp" :aria-label="`Rediger ${strekningsvalg(valgtEgen)}`" @click="aapne('rediger')">Rediger</button>
      <button type="button" class="knapp knapp-fare" :aria-label="`Slett ${strekningsvalg(valgtEgen)}`" @click="slettDlg.showModal()">Slett</button>
    </div>

    <form v-if="modus" id="stasjon-skjema" ref="skjemaEl" class="mt-3 flex flex-col gap-3 rounded-xl border border-[var(--color-line)] p-3" novalidate @submit.prevent="lagre">
      <h4 class="font-semibold">{{ modus === 'ny' ? 'Ny strekning' : `Rediger ${strekningsvalg(valgtEgen)}` }}</h4>
      <p class="text-sm text-[var(--color-ink-2)]">Voksenpriser for strekningen. Du kan finne dem i Vy- eller Ruter-appen.</p>
      <p v-if="feilListe.length" class="text-sm text-[var(--color-bad)]" role="alert">Rett {{ feilListe.length === 1 ? 'feltet' : 'feltene' }} med feil før du lagrer.</p>
      <StasjonsSok
        id="st-navn"
        ref="fraSok"
        v-model:navn="skjema.navn"
        v-model:enturId="skjema.enturId"
        etikett="Fra stasjon"
        :feil="feil.navn"
        :tilleggsstatus="skjema.enturId ? flyStatus : ''"
        @valgt="fraValgt"
        @endret="fraEndret"
      />
      <StasjonsSok
        id="st-til"
        ref="tilSok"
        v-model:navn="skjema.til"
        v-model:enturId="skjema.tilEnturId"
        etikett="Til stasjon"
        :feil="feil.til"
        :standard-navn="OSLO_S"
        @valgt="tilValgt"
      />
      <div class="grid grid-cols-2 items-end gap-3">
        <div v-for="[felt, navn] in FELT.filter(([f]) => f !== 'lufthavn' || tilOslo)" :key="felt">
          <label class="etikett" :for="`st-${felt}`">{{ navn }}<template v-if="felt === 'lufthavn' && skjema.bakOsloS !== false"> (valgfritt)</template></label>
          <Beloep :id="`st-${felt}`" v-model="skjema[felt]" :ugyldig="Boolean(feil[felt])" :max="MAKS_PRIS[felt]" :feil-id="feil[felt] ? `st-${felt}-feil` : undefined" />
          <p v-if="feil[felt]" :id="`st-${felt}-feil`" class="mt-1 text-sm text-[var(--color-bad)]">{{ feil[felt] }}</p>
        </div>
      </div>
      <p v-if="tilOslo" class="text-sm text-[var(--color-ink-2)]">
        <template v-if="skjema.bakOsloS === false">Flyplassen ligger før Oslo S på din reise. Periodebilletten dekker da hele veien, og flyplassprisen brukes bare når du ikke har gyldig billett.</template>
        <template v-else>Billett til Oslo lufthavn er valgfri. Uten den regner vi enkeltbillett pluss 134 kr (tillegget Oslo S–Oslo lufthavn).</template>
      </p>
      <div class="flex justify-end gap-2">
        <button type="button" class="knapp" @click="lukk(modus === 'ny' ? leggTilKnapp : redigerKnapp)">Avbryt</button>
        <button type="submit" class="knapp knapp-primaer">Lagre</button>
      </div>
    </form>

    <dialog ref="slettDlg" class="bekreft" aria-labelledby="sl-tittel" aria-describedby="sl-tekst">
      <div class="flex flex-col gap-3 p-5">
        <h2 id="sl-tittel" class="text-lg font-semibold">Slette {{ valgtEgen ? strekningsvalg(valgtEgen) : 'strekningen' }}?</h2>
        <p id="sl-tekst" class="text-[var(--color-ink-2)]">Strekningen og prisene du la inn fjernes. Appen bytter til {{ stasjonsnavn(PRESETS[0]) }}.</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="knapp" autofocus @click="slettDlg.close()">Avbryt</button>
          <button type="button" class="knapp knapp-fare" @click="slett">Ja, slett</button>
        </div>
      </div>
    </dialog>
  </div>
</template>
