<script setup>
import { computed, ref, watch } from 'vue'
import { APP_VERSION } from '../version.js'
import { PRESET_DATO } from '../lib/presets.js'
import { dagerTekst } from '../lib/format.js'
import { useTema } from '../composables/useTema.js'
import StasjonsValg from './StasjonsValg.vue'
import Beloep from './Beloep.vue'
import PrefBryter from './PrefBryter.vue'
import FerieListe from './FerieListe.vue'
import EksisterendeBillett from './EksisterendeBillett.vue'

const m = defineModel('modell', { type: Object })
const stasjon = computed(() => m.value.strekninger[0]?.navn.split('–')[0] ?? 'stasjon')
const apen = defineModel('apen', { type: Boolean })
const emit = defineEmits(['nullstill'])

const { tema, skala } = useTema()
const dlg = ref(null)
const bekreft = ref(null)
// Tekststørrelsen settes ved slipp, så ikke menyen flytter seg under fingeren.
const skalaVis = ref(skala.value)
const settSkala = () => (skala.value = skalaVis.value)
const nullstillNaa = () => {
  bekreft.value.close()
  apen.value = false
  emit('nullstill')
}

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

      <section aria-labelledby="m-dager" class="flex flex-col">
        <h3 id="m-dager" class="seksjonstittel mb-1">Fri og ferie</h3>
        <PrefBryter v-model="m.innstillinger.jobberPaaskeMandagOnsdag" tittel="Jobber i påske mandag–onsdag" tekst="Skjærtorsdag til 2. påskedag er alltid fri." />
        <PrefBryter v-model="m.innstillinger.jobberRomjul" tittel="Jobber i romjul" tekst="27.–31. desember. Julaften er alltid fri." />
        <div class="mt-3"><FerieListe v-model="m" /></div>
      </section>

      <StasjonsValg v-model="m" />

      <section aria-labelledby="m-billett" class="flex flex-col gap-3">
        <h3 id="m-billett" class="seksjonstittel">Periodebillett du har nå</h3>
        <EksisterendeBillett v-model="m" />
      </section>

      <section aria-labelledby="m-tider" class="flex flex-col gap-3">
        <h3 id="m-tider" class="seksjonstittel">Avreisetid</h3>
        <div class="felt-par">
          <div>
            <label class="etikett" for="morgen">Fra {{ stasjon }}</label>
            <input id="morgen" v-model="m.morgen" class="felt" type="time" />
          </div>
          <div>
            <label class="etikett" for="ettermiddag">Fra Oslo S</label>
            <input id="ettermiddag" v-model="m.ettermiddag" class="felt" type="time" />
          </div>
        </div>
        <p class="text-sm text-[var(--color-ink-3)]">Billetten gjelder like lenge fra klokkeslettet du aktiverer den.</p>
      </section>

      <section aria-labelledby="m-pris" class="flex flex-col">
        <h3 id="m-pris" class="seksjonstittel mb-1">Priser og beregning</h3>
        <PrefBryter v-model="m.inkluderAarskort" tittel="Vurder årskort" tekst="Binder deg i 12 måneder." />
        <PrefBryter v-model="m.reis" tittel="Ruter Reis på enkeltbilletter" tekst="Rabatt fra 5 % på reise nr. 5 til 40 % fra reise nr. 40 de siste 30 dagene. Gjelder bare der Reis er tilgjengelig, og er ikke Vy Smartpris." />
        <PrefBryter v-model="m.prisokning.paa" tittel="Prisøkning hver 1. februar" tekst="Regn med at prisene stiger." />
        <div v-if="m.prisokning.paa" class="mt-2 felt-par">
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
              <label class="etikett" :for="`enkelt-${s.id}`">Enkeltbillett</label>
              <Beloep :id="`enkelt-${s.id}`" v-model="s.enkelt" placeholder="Ukjent" />
            </div>
            <div v-for="p in s.perioder" :key="p.dager">
              <label class="etikett" :for="`p-${s.id}-${p.dager}`">{{ dagerTekst(p.dager) }}</label>
              <Beloep :id="`p-${s.id}-${p.dager}`" v-model="p.pris" />
            </div>
            <p class="col-span-2 text-sm text-[var(--color-ink-3)]">Forslagsprisene er Vys voksenpriser {{ PRESET_DATO }}. Sjekk dem mot appen.</p>
          </div>
        </details>
      </section>

      <section aria-labelledby="m-utseende" class="flex flex-col gap-3">
        <h3 id="m-utseende" class="seksjonstittel">Utseende</h3>
        <div class="flex gap-2" role="group" aria-label="Tema">
          <button v-for="[id, navn] in TEMAER" :key="id" type="button" class="chip flex-1" :aria-pressed="tema === id" @click="tema = id">{{ navn }}</button>
        </div>
        <div>
          <label class="etikett" for="skala">Tekststørrelse: {{ skalaVis }} %</label>
          <input id="skala" v-model.number="skalaVis" type="range" min="100" max="200" step="5" @change="settSkala" />
        </div>
      </section>

      <footer class="flex items-center justify-between gap-3 border-t border-[var(--color-line)] pt-4 text-sm text-[var(--color-ink-3)]">
        <span>v{{ APP_VERSION }} · lagres i nettleseren</span>
        <button type="button" class="knapp" @click="bekreft.showModal()">Nullstill</button>
      </footer>
    </div>
  </dialog>

  <dialog ref="bekreft" class="bekreft" aria-labelledby="bk-tittel" aria-describedby="bk-tekst">
    <div class="flex flex-col gap-3 p-5">
      <h2 id="bk-tittel" class="text-lg font-semibold">Er du sikker?</h2>
      <p id="bk-tekst" class="text-[var(--color-ink-2)]">
        Alt du har lagt inn fjernes: ferie, billetten du har nå, egne priser og andre innstillinger. Du starter oppsettet på nytt.
      </p>
      <div class="flex justify-end gap-2">
        <button type="button" class="knapp" autofocus @click="bekreft.close()">Avbryt</button>
        <button type="button" class="knapp knapp-primaer" @click="nullstillNaa">Ja, nullstill</button>
      </div>
    </div>
  </dialog>
</template>
