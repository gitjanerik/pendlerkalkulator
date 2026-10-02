<script setup>
import { computed, ref } from 'vue'
import { PRESETS, strekningFraPreset } from '../lib/presets.js'
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

const STEG = ['stasjon', 'uke', 'tider', 'billett', 'fri', 'ferie', 'fritid', 'priser', 'klar']
const i = ref(0)
const retning = ref('frem')
const strekning = computed(() => m.value.strekninger[0])
const stasjon = computed(() => strekning.value?.navn.split('–')[0] ?? '')

const gaa = (n) => {
  const ny = Math.min(Math.max(i.value + n, 0), STEG.length - 1)
  if (ny === i.value) return
  retning.value = n > 0 ? 'frem' : 'tilbake'
  i.value = ny
}

const velgStasjon = (p) => {
  m.value.strekninger = [strekningFraPreset(p, p.id)]
}
const veksleDag = (d) => {
  const s = new Set(m.value.jobbUkedager)
  if (s.has(d)) {
    if (s.size === 1) return // minst én jobbdag
    s.delete(d)
  } else s.add(d)
  m.value.jobbUkedager = [...s].sort()
}
const pris = (dager) => strekning.value.perioder.find((p) => p.dager === dager)
const PRISFELT = [
  ['enkelt', 'Enkeltbillett'],
  [7, 'Ukeskort (7 dager)'],
  [30, 'Månedskort (30 dager)'],
  [365, 'Årskort (365 dager)'],
]

// Sveip mot venstre = neste, mot høyre = tilbake. Felt og knapper sveipes ikke, så glidere virker.
let start = null
const ned = (e) => {
  start = e.pointerType === 'mouse' || e.target.closest('input, textarea, select') ? null : { x: e.clientX, y: e.clientY }
}
const opp = (e) => {
  if (!start) return
  const dx = e.clientX - start.x
  const dy = e.clientY - start.y
  start = null
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) gaa(dx < 0 ? 1 : -1)
}
const taster = (e) => {
  if (e.target.closest('input, textarea, select')) return
  if (e.key === 'ArrowRight') gaa(1)
  if (e.key === 'ArrowLeft') gaa(-1)
}
</script>

<template>
  <section class="kort oppsett flex min-h-[calc(100dvh-6.5rem)] flex-col" aria-labelledby="op-tittel" @keydown="taster">
    <h2 id="op-tittel" class="seksjonstittel">Steg {{ i + 1 }} av {{ STEG.length }}</h2>

    <div class="mt-3 flex-1 overflow-hidden" style="touch-action: pan-y" @pointerdown="ned" @pointerup="opp" @pointercancel="start = null">
      <Transition :name="`gli-${retning}`" mode="out-in">
        <div :key="STEG[i]">
          <template v-if="STEG[i] === 'stasjon'">
            <h3 class="steg-tittel">Hvor reiser du fra?</h3>
            <p class="steg-tekst">Oslo S er målet.</p>
            <div class="mt-4 flex flex-wrap gap-2" role="group" aria-label="Fra-stasjon">
              <button v-for="p in PRESETS" :key="p.id" type="button" class="chip" :aria-pressed="strekning?.id === p.id" @click="velgStasjon(p)">{{ p.navn.split('–')[0] }}</button>
            </div>
          </template>

          <template v-else-if="STEG[i] === 'uke'">
            <h3 class="steg-tittel">Hvilke dager drar du på jobb?</h3>
            <div class="mt-4 flex flex-wrap gap-2" role="group" aria-label="Jobbdager">
              <button v-for="(d, n) in UKEDAGER_KORT" :key="d" type="button" class="chip" :aria-pressed="m.jobbUkedager.includes(n)" :aria-label="UKEDAGER_LANG[n]" @click="veksleDag(n)">{{ d }}</button>
            </div>
          </template>

          <template v-else-if="STEG[i] === 'tider'">
            <h3 class="steg-tittel">Når tar du toget?</h3>
            <p class="steg-tekst">Appen tar hensyn til at ny periodebillett ikke aktiveres før avreise (samme dag eller etter en helg).</p>
            <div class="mt-4 felt-par">
              <div>
                <label class="etikett" for="op-morgen">Fra {{ stasjon }}</label>
                <input id="op-morgen" v-model="m.morgen" class="felt" type="time" />
              </div>
              <div>
                <label class="etikett" for="op-ettermiddag">Fra Oslo S</label>
                <input id="op-ettermiddag" v-model="m.ettermiddag" class="felt" type="time" />
              </div>
            </div>
            <div class="mt-3"><ForslagKnapp v-model="m" :stasjon="stasjon" :hint="false" /></div>
          </template>

          <template v-else-if="STEG[i] === 'billett'">
            <h3 class="steg-tittel">Har du en periodebillett nå?</h3>
            <p class="steg-tekst">Da starter beregningen når den utløper.</p>
            <div class="mt-4"><EksisterendeBillett v-model="m" /></div>
          </template>

          <template v-else-if="STEG[i] === 'fri'">
            <h3 class="steg-tittel">Påske og romjul</h3>
            <p class="steg-tekst">Jobber du disse dagene? Helligdagene er alltid fri.</p>
            <div class="mt-3 flex flex-col">
              <PrefBryter v-model="m.innstillinger.jobberPaaskeMandagOnsdag" tittel="Jobber i påske mandag–onsdag" tekst="Skjærtorsdag til 2. påskedag er alltid fri." />
              <PrefBryter v-model="m.innstillinger.jobberRomjul" tittel="Jobber i romjul" tekst="27.–31. desember. Julaften er alltid fri." />
            </div>
          </template>

          <template v-else-if="STEG[i] === 'ferie'">
            <h3 class="steg-tittel">Ferie og fri</h3>
            <p class="steg-tekst">Valgfritt. Legg inn eller importer fra kalenderen, så stemmer beregningen fra start.</p>
            <div class="mt-4"><FerieListe v-model="m" /></div>
          </template>

          <template v-else-if="STEG[i] === 'fritid'">
            <h3 class="steg-tittel">Fritidsreiser</h3>
            <p class="steg-tekst">Valgfritt. Skal du til Oslo lufthavn en bestemt dag? Da regner vi med tilleggsbilletten, og at periodebilletten dekker resten.</p>
            <div class="mt-4"><FritidListe v-model="m" /></div>
          </template>

          <template v-else-if="STEG[i] === 'priser'">
            <h3 class="steg-tittel">Stemmer prisene?</h3>
            <p class="steg-tekst">{{ stasjon }} – Oslo S, voksen. Rett dem hvis de er feil.</p>
            <div class="mt-4 grid grid-cols-2 items-end gap-3">
              <div v-for="[n, navn] in PRISFELT" :key="n">
                <label class="etikett" :for="`pr-${n}`">{{ navn }}</label>
                <Beloep v-if="n === 'enkelt'" :id="`pr-${n}`" v-model="strekning.enkelt" />
                <Beloep v-else-if="pris(n)" :id="`pr-${n}`" v-model="pris(n).pris" />
              </div>
            </div>
            <p class="mt-3 text-sm text-[var(--color-ink-2)]">
              Prisene ligger i appen og oppdateres med jevne mellomrom.
            </p>
          </template>

          <template v-else>
            <h3 class="steg-tittel">Alt klart!</h3>
            <p class="steg-tekst">Vi har nok til å finne billettene som holder deg på skinnene til lavest mulig pris.</p>
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
            <button type="button" class="klar" :class="{ 'mt-4!': tilbyInstall }" @click="settIGang">
              <span aria-hidden="true">🚂</span> Sett i gang! <span aria-hidden="true">💨</span>
            </button>
          </template>
        </div>
      </Transition>
    </div>

    <div class="mt-3 flex justify-center gap-3">
      <button type="button" class="knapp ikon" aria-label="Tilbake" :disabled="i === 0" @click="gaa(-1)">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
      </button>
      <button type="button" class="knapp knapp-primaer ikon" aria-label="Neste" :disabled="i === STEG.length - 1" @click="gaa(1)">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
    <ol class="mt-3 flex items-center justify-center gap-2" aria-hidden="true">
      <li v-for="(s, n) in STEG" :key="s" class="h-2 rounded-full transition-all" :class="n === i ? 'w-5 bg-[var(--color-accent)]' : 'w-2 bg-[var(--color-line)]'" />
    </ol>
  </section>
</template>

<style scoped>
.ikon {
  width: 3.5rem;
  padding: 0;
}
.steg-tittel {
  font-size: 1.5rem;
  line-height: 1.2;
  font-weight: 600;
}
.steg-tekst {
  margin-top: 0.25rem;
  color: var(--color-ink-2);
}
.klar {
  margin-top: 2rem;
  width: 100%;
  min-height: 5rem;
  border-radius: 1.25rem;
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-size: 1.5rem;
  font-weight: 700;
  animation: puls 2s ease-in-out infinite;
}
@keyframes puls {
  50% {
    transform: scale(1.03);
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
