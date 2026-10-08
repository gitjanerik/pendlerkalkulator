<script setup>
import { computed, ref } from 'vue'
import StasjonsChips from './StasjonsChips.vue'
import { APP_VERSION } from '../version.js'
import { flyplassForhold } from '../lib/fritid.js'
import { maalnavn, OSLO_S, stasjonsnavn } from '../lib/stasjoner.js'
import { UKEDAGER_KORT, UKEDAGER_LANG } from '../lib/dagmonster.js'
import Beloep from './Beloep.vue'
import PrefBryter from './PrefBryter.vue'
import EksisterendeBillett from './EksisterendeBillett.vue'
import FerieListe from './FerieListe.vue'
import FritidListe from './FritidListe.vue'
import ForslagKnapp from './ForslagKnapp.vue'
import { usePwaInstall } from '../composables/usePwaInstall.js'

const m = defineModel({ type: Object })
const emit = defineEmits(['klar'])

const { canInstall, isInstalled, isIOS, installer } = usePwaInstall()
const tilbyInstall = computed(() => !isInstalled.value && (canInstall.value || isIOS.value))
const installerValgt = ref(false)
const settIGang = async () => {
  // Prompten må startes av selve trykket, så den kjøres før vi går videre
  if (installerValgt.value && canInstall.value) await installer()
  emit('klar')
}

const ALLE_STEG = ['intro', 'stasjon', 'uke', 'tider', 'billett', 'fri', 'ferie', 'fritid', 'priser', 'klar']
const TITLER = {
  intro: 'Kan du spare noe?',
  stasjon: 'Hvilken strekning reiser du?',
  uke: 'Hvilke dager drar du på jobb?',
  tider: 'Når tar du toget?',
  billett: 'Har du en periodebillett nå?',
  fri: 'Jobber du i påske og romjul?',
  ferie: 'Når har du ferie eller fri?',
  fritid: 'Har du fritidsreiser til flyplassen?',
  priser: 'Stemmer prisene?',
  klar: 'Alt klart!',
}
const i = ref(0)
const retning = ref('frem')
const nesteKnapp = ref(null)
const klarKnapp = ref(null)
const strekning = computed(() => m.value.strekninger[0])
const stasjon = computed(() => (strekning.value ? stasjonsnavn(strekning.value) : ''))
const maal = computed(() => (strekning.value ? maalnavn(strekning.value) : OSLO_S))
// Fritidsreiser til flyplassen finnes bare for strekninger til Oslo S.
const forhold = computed(() => flyplassForhold(strekning.value))
const STEG = computed(() => ALLE_STEG)

const gaa = (n) => {
  const ny = Math.min(Math.max(i.value + n, 0), STEG.value.length - 1)
  if (ny === i.value) return
  retning.value = n > 0 ? 'frem' : 'tilbake'
  i.value = ny
}

// Knappen som ble trykt skjules i endene; fokus må videre til noe som finnes.
const etterSteg = () => {
  if (document.activeElement && document.activeElement !== document.body) return
  if (i.value === STEG.value.length - 1) klarKnapp.value?.focus()
  else if (i.value === 0) nesteKnapp.value?.focus()
}

const dagMelding = ref('')
const veksleDag = (d) => {
  const s = new Set(m.value.jobbUkedager)
  if (s.has(d)) {
    if (s.size === 1) {
      dagMelding.value = 'Du må ha minst én dag valgt. Velg en annen dag først.'
      return
    }
    s.delete(d)
  } else s.add(d)
  dagMelding.value = ''
  m.value.jobbUkedager = [...s].sort()
}
const pris = (dager) => strekning.value.perioder.find((p) => p.dager === dager)
const PRISFELT = [
  ['enkelt', 'Enkeltbillett'],
  ['lufthavn', 'Enkeltbillett til Oslo lufthavn'],
  [7, 'Ukeskort (7 dager)'],
  [30, 'Månedskort (30 dager)'],
  [365, 'Årskort (365 dager)'],
]

// Sveip mot venstre = neste, mot høyre = tilbake. Felt og knapper sveipes ikke, så glidere virker.
let start = null
const ned = (e) => {
  start = e.pointerType === 'mouse' || e.target.closest('input, textarea, select, dialog') ? null : { x: e.clientX, y: e.clientY }
}
const opp = (e) => {
  if (!start) return
  const dx = e.clientX - start.x
  const dy = e.clientY - start.y
  start = null
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) gaa(dx < 0 ? 1 : -1)
}
// Piltastene bytter steg bare med fokus på Tilbake/Neste. På kontrollene i et steg ville fokus forsvunnet når innholdet byttes.
const taster = (e) => {
  if (e.defaultPrevented || !e.target.closest('[data-steg-nav]')) return
  if (e.key === 'ArrowRight') gaa(1)
  if (e.key === 'ArrowLeft') gaa(-1)
}
</script>

<template>
  <section class="kort oppsett flex min-h-[calc(100dvh-7.5rem)] flex-col" aria-labelledby="op-steg" @keydown="taster">
    <p id="op-steg" class="text-sm font-semibold tracking-wide text-[var(--color-accent-text)] tabular-nums" aria-live="polite" aria-atomic="true">Steg {{ i + 1 }} av {{ STEG.length }}<span class="sr-only">: {{ TITLER[STEG[i]] }}</span></p>
    <ol class="fremdrift mt-2" aria-hidden="true">
      <li v-for="(s, n) in STEG" :key="s" :data-ferdig="n <= i" :data-naa="n === i" />
    </ol>

    <!-- Polstring og negativ marg gir fokusringen plass innenfor overflow-hidden. -->
    <div class="-mx-4 -mb-4 mt-0 flex-1 overflow-hidden p-4" style="touch-action: pan-y" @pointerdown="ned" @pointerup="opp" @pointercancel="start = null">
      <Transition :name="`gli-${retning}`" mode="out-in" @after-enter="etterSteg">
        <div :key="STEG[i]">
          <h2 class="steg-tittel">{{ TITLER[STEG[i]] }}</h2>
          <template v-if="STEG[i] === 'intro'">
            <p class="steg-tekst">
              Pendler du 4–5 dager i uka, er månedskort eller årskort nesten alltid billigst. Å tilpasse billettene sparer da bare 100–600 kr i året, under 2 %. Det kan lønne seg å beholde det du har. Gevinsten er størst i situasjonene under.
            </p>
            <h3 class="seksjonstittel mt-5">Her kan du spare mest</h3>
            <ul class="mt-2 flex flex-col gap-2">
              <li class="intro-kort">
                <strong class="block text-base">Færre enn 4 dager i uka</strong>
                <span class="block text-sm text-[var(--color-ink-2)]">Med enkeltbilletter og ukeskort kan du spare 300–1 300 kr i året ved 2–3 dager, og ca. 27 % ved én dag.</span>
              </li>
              <li class="intro-kort">
                <strong class="block text-base">Årskort</strong>
                <span class="block text-sm text-[var(--color-ink-2)]">Koster som ti til elleve månedskort. Størst gevinst, men du binder deg i 12 måneder.</span>
                <PrefBryter v-model="m.inkluderAarskort" tittel="Vurder årskort" tekst="Appen foreslår årskort når det lønner seg." />
              </li>
              <li class="intro-kort">
                <strong class="block text-base">Ferie på tre uker eller mer</strong>
                <span class="block text-sm text-[var(--color-ink-2)]">Starter ferien rett etter en fornyelse, kan du spare opptil ett månedskort. Havner den uheldig, sparer du ingenting.</span>
              </li>
              <li class="intro-kort">
                <strong class="block text-base">Mange turer til flyplassen</strong>
                <span class="block text-sm text-[var(--color-ink-2)]">Med gyldig periodebillett slipper du ny billett hele veien. Ligger flyplassen før jobbstedet, koster turen ingenting ekstra. Ligger flyplassen bak jobbstedet, kjøper du bare tillegget dit. Appen tar hensyn til fritidsreisene når den velger startdato for billettene. Dette gjelder når flyplassen og jobbstedet ligger langs samme linje.</span>
              </li>
            </ul>
            <p class="mt-3 text-sm text-[var(--color-ink-3)]">Tallene er beregnet ut fra Vys priser høsten 2026.</p>
          </template>

          <template v-else-if="STEG[i] === 'stasjon'">
            <StasjonsChips v-model="m" kun-en class="mt-4" />
          </template>

          <template v-else-if="STEG[i] === 'uke'">
            <div class="dager mt-5" role="group" aria-label="Jobbdager">
              <button v-for="(d, n) in UKEDAGER_KORT" :key="d" type="button" class="chip dag-valg" :aria-pressed="m.jobbUkedager.includes(n)" :aria-label="UKEDAGER_LANG[n]" @click="veksleDag(n)">{{ d }}</button>
            </div>
            <p class="mt-2 text-sm text-[var(--color-ink-2)]" role="status">{{ dagMelding }}</p>
          </template>

          <template v-else-if="STEG[i] === 'tider'">
            <p class="steg-tekst">Appen regner med at en ny periodebillett ikke kan aktiveres før avreise (samme dag eller etter en helg).</p>
            <div class="mt-4 felt-par">
              <div>
                <label class="etikett" for="op-morgen">Fra {{ stasjon }}</label>
                <input id="op-morgen" v-model="m.morgen" class="felt" type="time" />
              </div>
              <div>
                <label class="etikett" for="op-ettermiddag">Fra {{ maal }}</label>
                <input id="op-ettermiddag" v-model="m.ettermiddag" class="felt" type="time" />
              </div>
            </div>
            <div class="mt-3"><ForslagKnapp v-model="m" :stasjon="stasjon" :maal="maal" /></div>
          </template>

          <template v-else-if="STEG[i] === 'billett'">
            <p class="steg-tekst">Da starter beregningen når billetten utløper.</p>
            <div class="mt-4"><EksisterendeBillett v-model="m" /></div>
          </template>

          <template v-else-if="STEG[i] === 'fri'">
            <p class="steg-tekst">Helligdagene er alltid fri. Slå på bryterne for dagene du jobber.</p>
            <div class="mt-3 flex flex-col">
              <PrefBryter v-model="m.innstillinger.jobberPaaskeMandagOnsdag" tittel="Jobber mandag–onsdag i påskeuka" tekst="Skjærtorsdag til 2. påskedag er alltid fri." />
              <PrefBryter v-model="m.innstillinger.jobberRomjul" tittel="Jobber i romjul" tekst="27.–30. desember. Julaften og nyttårsaften er alltid fri." />
            </div>
          </template>

          <template v-else-if="STEG[i] === 'ferie'">
            <p class="steg-tekst">Valgfritt. Legg inn ferien din eller importer den fra kalenderen, så tar beregningen hensyn til den.</p>
            <div class="mt-4"><FerieListe v-model="m" /></div>
          </template>

          <template v-else-if="STEG[i] === 'fritid'">
            <p class="steg-tekst">
              Valgfritt. Legg inn dagene du skal til Oslo lufthavn.
              <template v-if="forhold === 'bak'">Fra {{ stasjon }} ligger flyplassen bak {{ maal }}. Er periodebilletten gyldig, regner vi bare med tillegget {{ maal }}–Oslo lufthavn. Ellers regner vi med enkeltbillett hele veien.</template>
              <template v-else-if="forhold === 'foer'">Fra {{ stasjon }} ligger flyplassen på veien til {{ maal }}. Er periodebilletten gyldig, koster reisen ingenting ekstra. Ellers regner vi med enkeltbillett til flyplassen.</template>
              <template v-else>{{ maal }} ligger ikke på veien til flyplassen, så periodebilletten hjelper ikke. Vi regner enkeltbillett til flyplassen for hver reise.</template>
            </p>
            <div class="mt-4"><FritidListe v-model="m" /></div>
          </template>

          <template v-else-if="STEG[i] === 'priser'">
            <p class="steg-tekst">{{ stasjon }} – {{ maal }}, voksen. Endre prisene hvis noe er feil.</p>
            <div class="mt-4 grid grid-cols-2 items-end gap-3">
              <div v-for="[n, navn] in PRISFELT" :key="n">
                <label class="etikett" :for="`pr-${n}`">{{ navn }}</label>
                <Beloep v-if="n === 'enkelt'" :id="`pr-${n}`" v-model="strekning.enkelt" />
                <Beloep v-else-if="n === 'lufthavn'" :id="`pr-${n}`" v-model="strekning.lufthavn" placeholder="Ukjent" />
                <Beloep v-else-if="pris(n)" :id="`pr-${n}`" v-model="pris(n).pris" />
              </div>
            </div>
            <p class="mt-3 text-sm text-[var(--color-ink-2)]">
              Prisene er forslag. Sjekk dem hos Vy eller Ruter.
            </p>
          </template>

          <template v-else>
            <p class="steg-tekst">Nå har vi nok til å lage et forslag ut fra prisene du har lagt inn.</p>
            <label v-if="tilbyInstall && !isIOS" class="mt-6 flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-3">
              <input v-model="installerValgt" type="checkbox" class="mt-1 h-5 w-5 shrink-0 accent-[var(--color-accent)]" />
              <span>
                <span class="block font-medium">Installer som app</span>
                <span class="block text-sm text-[var(--color-ink-2)]">Eget ikon på hjemskjermen, full skjerm og raskere start.</span>
              </span>
            </label>
            <p v-else-if="tilbyInstall" class="mt-6 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-3 text-sm text-[var(--color-ink-2)]">
              <strong class="text-[var(--color-ink)]">Legg til som app:</strong> trykk Del-ikonet i Safari og velg «Legg til på Hjem-skjerm».
            </p>
            <button ref="klarKnapp" type="button" class="klar" :class="{ 'mt-4!': tilbyInstall }" @click="settIGang">
              <span aria-hidden="true">🚂</span> Se beregning <span aria-hidden="true">💨</span>
            </button>
          </template>
        </div>
      </Transition>
    </div>

    <p class="mt-4 text-center text-sm text-[var(--color-ink-3)]">v{{ APP_VERSION }}</p>

    <!-- Skjult (ikke deaktivert) i endene, så ingen knapp står igjen som ikke gjør noe. Klebrig nederst så Neste alltid er innen rekkevidde. -->
    <div class="nav grid grid-cols-2 gap-3" data-steg-nav>
      <button type="button" class="knapp min-h-14 text-base" :class="{ invisible: i === 0 }" @click="gaa(-1)">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        Tilbake
      </button>
      <button ref="nesteKnapp" type="button" class="knapp knapp-primaer min-h-14 text-base" :class="{ invisible: i === STEG.length - 1 }" @click="gaa(1)">
        Neste
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  </section>
</template>

<style scoped>
.steg-tittel {
  font-size: 1.75rem;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.fremdrift {
  display: flex;
  gap: 0.25rem;
}
.fremdrift li {
  height: 0.5rem;
  flex: 1;
  border-radius: 9999px;
  background: var(--color-line);
  transition: background-color 0.25s ease;
}
.fremdrift li[data-ferdig='true'] {
  background: var(--color-accent);
}
.fremdrift li[data-naa='true'] {
  background: linear-gradient(90deg, var(--color-accent-lo), var(--color-accent-hi));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 25%, transparent);
}
.intro-kort {
  border: 1px solid var(--color-line);
  border-radius: 1rem;
  background: var(--color-surface-2);
  padding: 0.75rem 1rem;
}
.dager {
  display: grid;
  gap: 0.375rem;
  grid-template-columns: repeat(auto-fit, minmax(3.25rem, 1fr));
}
.dag-valg {
  min-height: 3.75rem;
  border-radius: 1rem;
  padding-inline: 0;
  font-size: 1rem;
}
.nav {
  position: sticky;
  bottom: 0;
  z-index: 5;
  margin: 0.75rem -1rem -1rem;
  padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom));
  border-top: 1px solid var(--color-line);
  border-radius: 0 0 1.5rem 1.5rem;
  background: var(--color-surface);
}
@supports (backdrop-filter: blur(1px)) {
  .nav {
    background: color-mix(in srgb, var(--color-surface) 82%, transparent);
    backdrop-filter: blur(12px);
  }
}
@media (min-width: 640px) {
  .nav {
    margin: 0.75rem -1.5rem -1.5rem;
    padding-inline: 1.5rem;
  }
}
.steg-tekst {
  margin-top: 0.25rem;
  color: var(--color-ink-2);
}
.klar {
  margin-top: 2rem;
  width: 100%;
  min-height: 5rem;
  border-radius: 1.5rem;
  background: linear-gradient(180deg, var(--color-accent-hi), var(--color-accent-lo));
  box-shadow: var(--shadow-lofte);
  color: var(--color-on-accent);
  font-size: 1.5rem;
  font-weight: 800;
  animation: puls 2s ease-in-out infinite;
}
@keyframes puls {
  50% {
    transform: scale(1.03);
  }
}
@media (prefers-reduced-motion: reduce) {
  .klar {
    animation: none;
  }
}
.gli-frem-enter-active,
.gli-frem-leave-active,
.gli-tilbake-enter-active,
.gli-tilbake-leave-active {
  transition:
    transform 0.18s ease,
    opacity 0.18s ease;
}
/* Sveip mot venstre = neste: innholdet følger fingeren mot venstre. */
.gli-frem-leave-to,
.gli-tilbake-enter-from {
  transform: translateX(-2rem);
  opacity: 0;
}
.gli-frem-enter-from,
.gli-tilbake-leave-to {
  transform: translateX(2rem);
  opacity: 0;
}
</style>
