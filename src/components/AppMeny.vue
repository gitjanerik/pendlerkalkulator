<script setup>
import { ref, watch } from 'vue'
import { APP_VERSION } from '../version.js'
import { PRESET_DATO } from '../lib/presets.js'
import { slaaSammenFerie } from '../lib/ics.js'
import { useTema } from '../composables/useTema.js'
import PrefBryter from './PrefBryter.vue'
import IcsImport from './IcsImport.vue'

const m = defineModel('modell', { type: Object })
const apen = defineModel('apen', { type: Boolean })
defineEmits(['nullstill'])

const { tema, skala } = useTema()
const dlg = ref(null)

watch(apen, (v) => {
  if (v && !dlg.value.open) dlg.value.showModal()
  if (!v && dlg.value.open) dlg.value.close()
})

const TEMAER = [
  ['auto', 'Auto'],
  ['lys', 'Lys'],
  ['mork', 'Mørk'],
]
const klikkBakgrunn = (e) => {
  if (e.target === dlg.value) apen.value = false
}
const importerFerie = (i) => (m.value.ferie = slaaSammenFerie([...m.value.ferie, ...i]))
</script>

<template>
  <dialog ref="dlg" class="meny" aria-labelledby="meny-tittel" @close="apen = false" @click="klikkBakgrunn">
    <div class="flex flex-col gap-7 px-4 pt-3 pb-8">
      <div class="flex items-center justify-between">
        <h2 id="meny-tittel" class="text-xl font-semibold">Innstillinger</h2>
        <button type="button" class="grid h-11 w-11 place-items-center rounded-full hover:bg-[var(--color-app)]" aria-label="Lukk meny" @click="apen = false">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <section aria-labelledby="m-utseende" class="flex flex-col gap-3">
        <h3 id="m-utseende" class="seksjonstittel">Utseende</h3>
        <div class="flex gap-2" role="group" aria-label="Tema">
          <button v-for="[id, navn] in TEMAER" :key="id" type="button" class="chip flex-1" :aria-pressed="tema === id" @click="tema = id">{{ navn }}</button>
        </div>
        <div>
          <label class="etikett" for="skala">Tekststørrelse: {{ skala }} %</label>
          <input id="skala" v-model.number="skala" type="range" min="100" max="200" step="5" />
        </div>
      </section>

      <section aria-labelledby="m-dager" class="flex flex-col">
        <h3 id="m-dager" class="seksjonstittel mb-1">Fri og ferie</h3>
        <PrefBryter v-model="m.innstillinger.jobberPaaskeMandagOnsdag" tittel="Jobber i påske mandag–onsdag" tekst="Skjærtorsdag til 2. påskedag er alltid fri." />
        <PrefBryter v-model="m.innstillinger.jobberRomjul" tittel="Jobber i romjul" tekst="27.–31. desember. Julaften er alltid fri." />
        <ul class="mt-2 flex flex-col gap-2">
          <li v-for="(f, i) in m.ferie" :key="i" class="flex items-center gap-2">
            <input v-model="f.fra" class="felt" type="date" :aria-label="`Ferie ${i + 1}, fra`" />
            <span aria-hidden="true">–</span>
            <input v-model="f.til" class="felt" type="date" :aria-label="`Ferie ${i + 1}, til`" />
            <button type="button" class="knapp px-3" :aria-label="`Fjern ferie ${i + 1}`" @click="m.ferie.splice(i, 1)">✕</button>
          </li>
        </ul>
        <div class="mt-3 flex flex-wrap gap-2">
          <button type="button" class="knapp" @click="m.ferie.push({ fra: '', til: '' })">+ Legg til ferie</button>
          <IcsImport @importer="importerFerie" />
        </div>
      </section>

      <section aria-labelledby="m-tider" class="flex flex-col gap-3">
        <h3 id="m-tider" class="seksjonstittel">Reisetider</h3>
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
        <p class="text-sm text-[var(--color-ink-3)]">Billetten gjelder like lenge fra klokkeslettet du aktiverer den.</p>
      </section>

      <section aria-labelledby="m-pris" class="flex flex-col">
        <h3 id="m-pris" class="seksjonstittel mb-1">Priser og beregning</h3>
        <PrefBryter v-model="m.inkluderAarskort" tittel="Vurder årskort" tekst="Binder deg i 12 måneder." />
        <PrefBryter v-model="m.prisokning.paa" tittel="Prisøkning hver 1. februar" tekst="Regn med at prisene stiger." />
        <div v-if="m.prisokning.paa" class="mt-2 grid grid-cols-2 gap-3">
          <div>
            <label class="etikett" for="prosent">Økning (%)</label>
            <input id="prosent" v-model.number="m.prisokning.prosent" class="felt" type="number" inputmode="decimal" min="0" step="0.1" />
          </div>
          <div>
            <label class="etikett" for="prisdato">Prisene gjelder fra</label>
            <input id="prisdato" v-model="m.prisDato" class="felt" type="date" />
          </div>
        </div>

        <details v-for="s in m.strekninger" :key="s.id" class="mt-3 rounded-xl border border-[var(--color-line)] px-3">
          <summary class="flex min-h-11 cursor-pointer items-center font-medium">{{ s.navn }} – priser</summary>
          <div class="grid grid-cols-2 gap-3 pb-3">
            <div>
              <label class="etikett" :for="`enkelt-${s.id}`">Enkeltbillett (kr)</label>
              <input :id="`enkelt-${s.id}`" v-model.number="s.enkelt" class="felt" type="number" inputmode="decimal" min="0" placeholder="Ukjent" />
            </div>
            <div v-for="p in s.perioder" :key="p.dager">
              <label class="etikett" :for="`p-${s.id}-${p.dager}`">{{ p.dager }} dager (kr)</label>
              <input :id="`p-${s.id}-${p.dager}`" v-model.number="p.pris" class="felt" type="number" inputmode="decimal" min="0" />
            </div>
            <div class="col-span-2">
              <label class="etikett" :for="`rabatt-${s.id}`">Rabatt på enkeltbilletter (%)</label>
              <input :id="`rabatt-${s.id}`" v-model.number="s.reisRabattProsent" class="felt" type="number" inputmode="decimal" min="0" max="100" placeholder="0" />
              <p class="mt-1 text-sm text-[var(--color-ink-3)]">Vy Reis og Ruter-rabatter kommer som egne valg senere; til da kan du legge inn prosenten selv.</p>
            </div>
            <p class="col-span-2 text-sm text-[var(--color-ink-3)]">Forslagsprisene er Vys voksenpriser {{ PRESET_DATO }}. Sjekk dem mot appen.</p>
          </div>
        </details>
      </section>

      <footer class="flex items-center justify-between gap-3 border-t border-[var(--color-line)] pt-4 text-sm text-[var(--color-ink-3)]">
        <span>v{{ APP_VERSION }} · lagres i nettleseren</span>
        <button type="button" class="knapp" @click="$emit('nullstill')">Nullstill</button>
      </footer>
    </div>
  </dialog>
</template>
