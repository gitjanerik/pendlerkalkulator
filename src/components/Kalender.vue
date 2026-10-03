<script setup>
import { computed, nextTick, ref, useId } from 'vue'
import { isoFraDagNr, dagNr, leggTilDager, leggTilMaaneder, ukedag, idagIso } from '../lib/dato.js'
import { MAANED_NAVN, UKEDAG_NAVN, UKEDAG_LANGE, norskDatoLang } from '../lib/format.js'

// Områdevelger: trykk startdato, så sluttdato. Sender først når begge er valgt,
// så modellen aldri står med en halv periode.
const props = defineProps({
  fra: { type: String, default: '' },
  til: { type: String, default: '' },
  tekstStart: { type: String, default: 'Velg startdato, så sluttdato.' },
  // {dato} byttes med den første valgte datoen
  tekstSlutt: { type: String, default: 'Fra {dato}. Velg sluttdato.' },
})
const emit = defineEmits(['velg', 'lukk'])

const id = useId()
const pad = (n) => String(n).padStart(2, '0')
const idag = idagIso()

const start = props.fra || idag
const aar = ref(Number(start.slice(0, 4)))
const mnd = ref(Number(start.slice(5, 7)))
const anker = ref('')
const sveve = ref('')
const fokus = ref('')
const rot = ref(null)

const maaned = computed(() => `${aar.value}-${pad(mnd.value)}`)

const flytt = (n) => {
  const t = aar.value * 12 + (mnd.value - 1) + n
  aar.value = Math.floor(t / 12)
  mnd.value = (t % 12) + 1
}

const uker = computed(() => {
  const forste = `${maaned.value}-01`
  const antall = new Date(Date.UTC(aar.value, mnd.value, 0)).getUTCDate()
  const celler = [
    ...Array.from({ length: ukedag(forste) }, () => null),
    ...Array.from({ length: antall }, (_, i) => isoFraDagNr(dagNr(forste) + i)),
  ]
  while (celler.length % 7) celler.push(null)
  return Array.from({ length: celler.length / 7 }, (_, i) => celler.slice(i * 7, i * 7 + 7))
})

const omraade = computed(() => {
  if (anker.value) return [anker.value, sveve.value || anker.value].sort()
  return props.fra && props.til ? [props.fra, props.til] : ['', '']
})
const ende = (d) => d === omraade.value[0] || d === omraade.value[1]
const inni = (d) => d > omraade.value[0] && d < omraade.value[1]

// Bare én dato er i tabrekkefølgen (rullende tabindex); piltastene flytter resten.
const tabDato = computed(() => {
  const iMaaned = (d) => d && d.startsWith(maaned.value)
  return [fokus.value, anker.value, props.fra, idag].find(iMaaned) ?? `${maaned.value}-01`
})

const etikett = (d) => `${norskDatoLang(d)}${inni(d) ? ', i perioden' : ''}`

function trykk(d) {
  if (!anker.value) {
    anker.value = d
    sveve.value = ''
    return
  }
  const [a, b] = [anker.value, d].sort()
  anker.value = ''
  emit('velg', { fra: a, til: b })
}

const PILER = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
function taster(e) {
  const d = e.target.dataset?.dato
  if (!d || e.altKey || e.ctrlKey || e.metaKey) return
  let ny
  if (Object.hasOwn(PILER, e.key)) ny = leggTilDager(d, PILER[e.key])
  else if (e.key === 'Home') ny = leggTilDager(d, -ukedag(d))
  else if (e.key === 'End') ny = leggTilDager(d, 6 - ukedag(d))
  else if (e.key === 'PageUp') ny = leggTilMaaneder(d, e.shiftKey ? -12 : -1)
  else if (e.key === 'PageDown') ny = leggTilMaaneder(d, e.shiftKey ? 12 : 1)
  else return
  e.preventDefault()
  fokus.value = ny
  aar.value = Number(ny.slice(0, 4))
  mnd.value = Number(ny.slice(5, 7))
  nextTick(() => rot.value?.querySelector(`[data-dato="${ny}"]`)?.focus())
}

function paaFokus(d) {
  fokus.value = d
  if (anker.value) sveve.value = d
}

defineExpose({ fokuser: () => rot.value?.querySelector('[role="grid"] [tabindex="0"]')?.focus() })
</script>

<template>
  <div ref="rot" data-kalender @keydown.esc.stop.prevent="emit('lukk')">
    <div class="flex items-center justify-between">
      <button type="button" class="knapp w-11 px-0" aria-label="Forrige måned" @click="flytt(-1)">‹</button>
      <p :id="`${id}-tittel`" class="font-semibold capitalize" aria-live="polite">{{ MAANED_NAVN[mnd - 1] }} {{ aar }}</p>
      <button type="button" class="knapp w-11 px-0" aria-label="Neste måned" @click="flytt(1)">›</button>
    </div>
    <div role="grid" :aria-labelledby="`${id}-tittel`" :aria-describedby="`${id}-hjelp ${id}-taster`" @keydown="taster">
      <div role="row" class="mt-2 grid grid-cols-7 text-center text-xs text-[var(--color-ink-3)]">
        <span v-for="(d, i) in UKEDAG_NAVN" :key="d" role="columnheader" :aria-label="UKEDAG_LANGE[i]">{{ d }}</span>
      </div>
      <div v-for="(uke, u) in uker" :key="u" role="row" class="mt-1 grid grid-cols-7">
        <div v-for="(d, k) in uke" :key="k" role="gridcell">
          <button
            v-if="d"
            type="button"
            class="dag"
            :class="{ ende: ende(d), inni: inni(d), idag: d === idag }"
            :data-dato="d"
            :tabindex="d === tabDato ? 0 : -1"
            :aria-label="etikett(d)"
            :aria-pressed="ende(d)"
            :aria-current="d === idag ? 'date' : undefined"
            @click="trykk(d)"
            @focus="paaFokus(d)"
            @pointerenter="sveve = anker ? d : ''"
          >
            {{ Number(d.slice(8)) }}
          </button>
        </div>
      </div>
    </div>
    <p :id="`${id}-hjelp`" class="mt-2 text-sm text-[var(--color-ink-2)]" aria-live="polite">
      {{ anker ? tekstSlutt.replace('{dato}', norskDatoLang(anker)) : tekstStart }}
    </p>
    <p :id="`${id}-taster`" class="sr-only">Piltastene flytter mellom datoer. Page Up og Page Down bytter måned. Escape lukker kalenderen.</p>
  </div>
</template>

<style scoped>
.dag {
  position: relative;
  width: 100%;
  min-height: 2.75rem;
  font-variant-numeric: tabular-nums;
  color: var(--color-ink);
}
.dag.inni {
  background: color-mix(in srgb, var(--color-accent) 22%, transparent);
}
.dag.ende {
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-weight: 600;
  border-radius: 9999px;
}
/* Ring i stedet for outline, så fokusringen er fri til å vise fokus på «i dag» også. */
.dag.idag:not(.ende)::after {
  content: '';
  position: absolute;
  inset: 4px;
  border: 1px solid var(--color-ink-3);
  border-radius: 9999px;
  pointer-events: none;
}
@media (forced-colors: active) {
  .dag.ende {
    forced-color-adjust: none;
    background: Highlight;
    color: HighlightText;
  }
  .dag.inni {
    border-block: 2px solid Highlight;
  }
}
</style>
