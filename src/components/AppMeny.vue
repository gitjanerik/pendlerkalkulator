<script setup>
import { computed, ref, watch } from 'vue'
import { APP_VERSION } from '../version.js'
import { PRESET_DATO } from '../lib/presets.js'
import { dagerTekst } from '../lib/format.js'
import { useTema } from '../composables/useTema.js'
import { usePwaInstall } from '../composables/usePwaInstall.js'
import StasjonsValg from './StasjonsValg.vue'
import { maalnavn, OSLO_S, stasjonsnavn } from '../lib/stasjoner.js'
import Beloep from './Beloep.vue'
import PrefBryter from './PrefBryter.vue'
import Varsel from './Varsel.vue'
import { delingsUrl } from '../lib/deling.js'
import { prisErGamle } from '../lib/priser.js'
import { idagIso } from '../lib/dato.js'
import { norskDatoLang } from '../lib/format.js'
import FerieListe from './FerieListe.vue'
import FritidListe from './FritidListe.vue'
import ForslagKnapp from './ForslagKnapp.vue'
import EksisterendeBillett from './EksisterendeBillett.vue'

const m = defineModel('modell', { type: Object })
const stasjon = computed(() => (m.value.strekninger[0] ? stasjonsnavn(m.value.strekninger[0]) : 'stasjon'))
const maal = computed(() => (m.value.strekninger[0] ? maalnavn(m.value.strekninger[0]) : OSLO_S))
// Redigerer de faktiske strekningene; den andre får egen nøkkel så id-ene ikke kolliderer.
const prisStrekninger = computed(() => [
  ...m.value.strekninger.map((s) => ({ s, nokkel: s.id })),
  ...(m.value.andreRute?.strekning ? [{ s: m.value.andreRute.strekning, nokkel: `${m.value.andreRute.strekning.id}-b` }] : []),
])
const apen = defineModel('apen', { type: Boolean })
// Feltene for nye priser opprettes når bryteren slås på, og for strekninger som kommer til etterpå.
const sikreNye = () => {
  if (!m.value.nyePriser?.paa) return
  for (const { s } of prisStrekninger.value) {
    s.nye ??= { enkelt: '', lufthavn: '', tillegg: '', perioder: [] }
    s.nye.perioder = s.perioder.map((p) => ({ dager: p.dager, pris: s.nye.perioder.find((n) => n.dager === p.dager)?.pris ?? '' }))
  }
}
watch(() => [m.value.nyePriser?.paa, prisStrekninger.value.length, apen.value], sikreNye, { immediate: true })
const gamlePriser = computed(() => prisErGamle(m.value.prisDato, idagIso()))
const delStatus = ref('')
let delTimer
const del = async () => {
  const url = delingsUrl(m.value, `${window.location.origin}${window.location.pathname}`)
  if (!url) return
  const data = { title: 'Pendlerkalkulator', text: `Pendlerkalkulator: ${m.value.strekninger[0].navn.replace('–', ' – ')}`, url }
  if (typeof navigator.share === 'function' && navigator.canShare?.(data) !== false) {
    try {
      await navigator.share(data)
      return
    } catch (e) {
      if (e?.name === 'AbortError') return
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    delStatus.value = 'Lenken er kopiert.'
  } catch {
    delStatus.value = 'Kunne ikke kopiere lenken.'
  }
  clearTimeout(delTimer)
  delTimer = setTimeout(() => (delStatus.value = ''), 4000)
}
// I veiviseren vises bare faste valg (utseende, app, versjon).
defineProps({ wizard: Boolean })
const emit = defineEmits(['nullstill'])

const { tema, skala } = useTema()
const { canInstall, isInstalled, isIOS, installer } = usePwaInstall()
const tilbyInstall = computed(() => !isInstalled.value && (canInstall.value || isIOS.value))
const dlg = ref(null)
const bekreft = ref(null)
// Tekststørrelsen settes ved slipp, så ikke menyen flytter seg under fingeren.
const skalaVis = ref(skala.value)
const settSkala = () => (skala.value = skalaVis.value)
const slettStasjoner = ref(false)
const aapneBekreft = () => {
  slettStasjoner.value = false
  bekreft.value.showModal()
}
const nullstillNaa = () => {
  bekreft.value.close()
  apen.value = false
  emit('nullstill', slettStasjoner.value)
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

      <div class="-mt-4 text-sm text-[var(--color-ink-2)]">
        <p>Lønner det seg å fornye månedskortet? Sammenlign periodebilletter og finn billigste kombinasjon for din arbeidsuke.</p>
        <details class="mt-2">
          <summary class="vis-pil min-h-11 font-medium text-[var(--color-ink)]">Lei av månedsbasert billettpsykose?</summary>
          <p class="mt-1">Som pendler er det surt å subsidiere Vy med dårlig utnyttede ukes- og månedskort. Legg inn ferie og fravær i god tid, så finner appen billigste totalpris. Jo lengre periode, jo bedre optimalisering.</p>
        </details>
      </div>

      <template v-if="!wizard">
        <section aria-labelledby="m-dager" class="flex flex-col">
          <h3 id="m-dager" class="seksjonstittel mb-1">Fri og ferie</h3>
          <PrefBryter v-model="m.innstillinger.jobberPaaskeMandagOnsdag" tittel="Jobber i påske mandag–onsdag" tekst="Skjærtorsdag til 2. påskedag er alltid fri." />
          <PrefBryter v-model="m.innstillinger.jobberRomjul" tittel="Jobber i romjul" tekst="27.–30. desember. Julaften og nyttårsaften er alltid fri." />
          <div class="mt-3"><FerieListe v-model="m" /></div>
        </section>

        <section aria-labelledby="m-fritid" class="flex flex-col">
          <h3 id="m-fritid" class="seksjonstittel mb-1">Fritidsreiser</h3>
          <FritidListe v-model="m" />
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
              <label class="etikett" for="ettermiddag">Fra {{ maal }}</label>
              <input id="ettermiddag" v-model="m.ettermiddag" class="felt" type="time" />
            </div>
          </div>
          <ForslagKnapp v-model="m" :stasjon="stasjon" :maal="maal" />
        </section>

        <section aria-labelledby="m-pris" class="flex flex-col">
          <h3 id="m-pris" class="seksjonstittel mb-1">Priser og beregning</h3>
          <PrefBryter v-model="m.inkluderAarskort" tittel="Vurder årskort" tekst="Binder deg i 12 måneder." />
          <PrefBryter v-if="prisStrekninger.some((x) => x.s.ruter)" v-model="m.reis" tittel="Ruter Reis på enkeltbilletter" tekst="Rabatt fra 5 % på reise nr. 5 til 40 % fra reise nr. 40 de siste 30 dagene. Gjelder bare innenfor Ruters soner (Oslo og Akershus), altså fra Asker. Vy Smartpris er ikke med." />
          <PrefBryter v-model="m.prisokning.paa" tittel="Årlig prisøkning" tekst="Regn med at prisene stiger. Appen antar 1. februar, men tidspunktet kan variere." />
          <div class="mt-2 felt-par">
            <div v-if="m.prisokning.paa">
              <label class="etikett" for="prosent">Økning (%)</label>
              <input id="prosent" v-model.number="m.prisokning.prosent" class="felt" type="number" inputmode="decimal" min="0" step="0.1" />
            </div>
            <div>
              <label class="etikett" for="prisdato">Prisene ble registrert</label>
              <input id="prisdato" v-model="m.prisDato" class="felt" type="date" />
            </div>
          </div>
          <PrefBryter v-if="m.nyePriser" v-model="m.nyePriser.paa" tittel="Nye priser fra en dato" tekst="Midlertidig: legg inn nye priser ved siden av dagens. Dagens priser gjelder før datoen, de nye fra og med den." />
          <div v-if="m.nyePriser?.paa" class="mt-2">
            <label class="etikett" for="nyprisdato">Nye priser gjelder fra</label>
            <input id="nyprisdato" v-model="m.nyePriser.dato" class="felt" type="date" :min="m.prisDato" />
            <p class="mt-1 text-sm text-[var(--color-ink-3)]">Fyll ut nye priser under hver strekning. Felt du lar stå tomme regnes som uendret. Fra og med datoen kan prosentøkningen komme på toppen ved neste prisøkning.</p>
          </div>
          <Varsel v-if="gamlePriser" class="mt-3">
            Prisene ble registrert {{ norskDatoLang(m.prisDato) }}, for mer enn tre måneder siden. Sjekk dem mot Vy og Ruter, og endre datoen når du har oppdatert.
          </Varsel>

          <details v-for="{ s, nokkel } in prisStrekninger" :key="nokkel" class="mt-3 rounded-xl border border-[var(--color-line)] px-3">
            <summary class="vis-pil min-h-11 font-medium">{{ s.navn }} – priser</summary>
            <div class="grid grid-cols-2 gap-3 pb-3">
              <div>
                <label class="etikett" :for="`enkelt-${nokkel}`">Enkeltbillett</label>
                <Beloep :id="`enkelt-${nokkel}`" v-model="s.enkelt" placeholder="Ukjent" />
              </div>
              <div v-if="nokkel === s.id">
                <label class="etikett" :for="`lufthavn-${nokkel}`">Enkeltbillett til Oslo lufthavn</label>
                <Beloep :id="`lufthavn-${nokkel}`" v-model="s.lufthavn" placeholder="Ukjent" />
              </div>
              <div v-for="p in s.perioder" :key="p.dager">
                <label class="etikett" :for="`p-${nokkel}-${p.dager}`">{{ dagerTekst(p.dager) }}</label>
                <Beloep :id="`p-${nokkel}-${p.dager}`" v-model="p.pris" />
              </div>
              <template v-if="m.nyePriser?.paa && s.nye">
                <h4 class="col-span-2 mt-1 border-t border-[var(--color-line)] pt-3 font-medium">Nye priser{{ m.nyePriser.dato ? ` fra ${norskDatoLang(m.nyePriser.dato)}` : '' }}</h4>
                <div>
                  <label class="etikett" :for="`ny-enkelt-${nokkel}`">Enkeltbillett</label>
                  <Beloep :id="`ny-enkelt-${nokkel}`" v-model="s.nye.enkelt" placeholder="Uendret" />
                </div>
                <div v-if="nokkel === s.id">
                  <label class="etikett" :for="`ny-lufthavn-${nokkel}`">Enkeltbillett til Oslo lufthavn</label>
                  <Beloep :id="`ny-lufthavn-${nokkel}`" v-model="s.nye.lufthavn" placeholder="Uendret" />
                </div>
                <div v-for="p in s.nye.perioder" :key="p.dager">
                  <label class="etikett" :for="`ny-p-${nokkel}-${p.dager}`">{{ dagerTekst(p.dager) }}</label>
                  <Beloep :id="`ny-p-${nokkel}-${p.dager}`" v-model="p.pris" placeholder="Uendret" />
                </div>
              </template>
              <p class="col-span-2 text-sm text-[var(--color-ink-3)]">Forslagsprisene er Vys voksenpriser {{ PRESET_DATO }}. Sjekk dem mot appen.</p>
            </div>
          </details>
        </section>

        <section aria-labelledby="m-del" class="flex flex-col gap-3">
          <h3 id="m-del" class="seksjonstittel">Del</h3>
          <p class="text-sm text-[var(--color-ink-2)]">Send en lenke med strekning, priser og eventuelle nye priser til en bekjent. Ferie, fritidsreiser og billetten du har nå følger ikke med.</p>
          <button type="button" class="knapp" @click="del">Del lenke</button>
          <p role="status" class="text-sm text-[var(--color-ink-2)]">{{ delStatus }}</p>
        </section>

      </template>

      <section aria-labelledby="m-utseende" class="flex flex-col gap-3">
        <h3 id="m-utseende" class="seksjonstittel">Utseende</h3>
        <div class="flex gap-2" role="group" aria-label="Tema">
          <button v-for="[id, navn] in TEMAER" :key="id" type="button" class="chip flex-1" :aria-pressed="tema === id" @click="tema = id">{{ navn }}</button>
        </div>
        <div>
          <label class="etikett" for="skala">Tekststørrelse: {{ skalaVis }} %</label>
          <input id="skala" v-model.number="skalaVis" type="range" min="100" max="200" step="5" :aria-valuetext="`${skalaVis} prosent`" @change="settSkala" />
        </div>
      </section>

      <section v-if="tilbyInstall" aria-labelledby="m-app" class="flex flex-col gap-3">
        <h3 id="m-app" class="seksjonstittel">App</h3>
        <p v-if="isIOS" class="text-sm text-[var(--color-ink-2)]">Trykk Del-ikonet i Safari og velg «Legg til på Hjem-skjerm».</p>
        <template v-else>
          <p class="text-sm text-[var(--color-ink-2)]">Eget ikon på hjemskjermen, full skjerm og raskere start.</p>
          <button type="button" class="knapp knapp-primaer" @click="installer">Installer som app</button>
        </template>
      </section>

      <div class="flex items-center justify-between gap-3 border-t border-[var(--color-line)] pt-4 text-sm text-[var(--color-ink-3)]">
        <span>v{{ APP_VERSION }}</span>
        <button v-if="!wizard" type="button" class="knapp knapp-fare" @click="aapneBekreft">Nullstill</button>
      </div>
    </div>
  </dialog>

  <dialog ref="bekreft" class="bekreft" aria-labelledby="bk-tittel" aria-describedby="bk-tekst">
    <div class="flex flex-col gap-3 p-5">
      <h2 id="bk-tittel" class="text-lg font-semibold">Er du sikker?</h2>
      <p id="bk-tekst" class="text-[var(--color-ink-2)]">
        Alt du har lagt inn fjernes: ferie, billetten du har nå, egne priser og andre innstillinger. Du starter oppsettet på nytt. Hjemstasjonene du har lagt til beholdes, med mindre du slår på bryteren under.
      </p>
      <PrefBryter v-model="slettStasjoner" tittel="Slett også egne hjemstasjoner" tekst="Stasjonene og prisene du la inn fjernes." />
      <div class="flex justify-end gap-2">
        <button type="button" class="knapp" autofocus @click="bekreft.close()">Avbryt</button>
        <button type="button" class="knapp knapp-fare" @click="nullstillNaa">Ja, nullstill</button>
      </div>
    </div>
  </dialog>
</template>
