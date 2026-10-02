<script setup>
import { computed, ref } from 'vue'
import { isoFraDagNr, dagNr, ukedag } from '../lib/dato.js'
import { norskDato } from '../lib/format.js'

// Områdevelger: trykk startdato, så sluttdato. Sender først når begge er valgt,
// så modellen aldri står med en halv periode.
const props = defineProps({
  fra: { type: String, default: '' },
  til: { type: String, default: '' },
  tekstStart: { type: String, default: 'Velg startdato, så sluttdato.' },
  // {dato} byttes med den første valgte datoen
  tekstSlutt: { type: String, default: 'Fra {dato}. Velg sluttdato.' },
})
const emit = defineEmits(['velg'])

const MAANEDER = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember']
const UKEDAGER = ['man', 'tir', 'ons', 'tor', 'fre', 'lør', 'søn']
const pad = (n) => String(n).padStart(2, '0')
const idag = isoFraDagNr(Math.floor(Date.now() / 86400000))

const start = props.fra || idag
const aar = ref(Number(start.slice(0, 4)))
const mnd = ref(Number(start.slice(5, 7)))
const anker = ref('')
const sveve = ref('')

const flytt = (n) => {
  const t = aar.value * 12 + (mnd.value - 1) + n
  aar.value = Math.floor(t / 12)
  mnd.value = (t % 12) + 1
}

const celler = computed(() => {
  const forste = `${aar.value}-${pad(mnd.value)}-01`
  const antall = new Date(Date.UTC(aar.value, mnd.value, 0)).getUTCDate()
  const tom = Array.from({ length: ukedag(forste) }, () => null)
  return [...tom, ...Array.from({ length: antall }, (_, i) => isoFraDagNr(dagNr(forste) + i))]
})

const omraade = computed(() => {
  if (anker.value) return [anker.value, sveve.value || anker.value].sort()
  return props.fra && props.til ? [props.fra, props.til] : ['', '']
})
const ende = (d) => d === omraade.value[0] || d === omraade.value[1]
const inni = (d) => d > omraade.value[0] && d < omraade.value[1]

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
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <button type="button" class="knapp w-11 px-0" aria-label="Forrige måned" @click="flytt(-1)">‹</button>
      <p class="font-semibold capitalize" aria-live="polite">{{ MAANEDER[mnd - 1] }} {{ aar }}</p>
      <button type="button" class="knapp w-11 px-0" aria-label="Neste måned" @click="flytt(1)">›</button>
    </div>
    <div class="mt-2 grid grid-cols-7 text-center text-xs text-[var(--color-ink-3)]" aria-hidden="true">
      <span v-for="d in UKEDAGER" :key="d">{{ d }}</span>
    </div>
    <div class="mt-1 grid grid-cols-7 gap-y-1">
      <template v-for="(d, i) in celler" :key="i">
        <span v-if="!d" />
        <button
          v-else
          type="button"
          class="dag"
          :class="{ ende: ende(d), inni: inni(d), idag: d === idag }"
          :aria-label="norskDato(d, true)"
          :aria-pressed="ende(d)"
          @click="trykk(d)"
          @pointerenter="sveve = anker ? d : ''"
        >
          {{ Number(d.slice(8)) }}
        </button>
      </template>
    </div>
    <p class="mt-2 text-sm text-[var(--color-ink-2)]" aria-live="polite">
      {{ anker ? tekstSlutt.replace('{dato}', norskDato(anker)) : tekstStart }}
    </p>
  </div>
</template>

<style scoped>
.dag {
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
.dag.idag:not(.ende) {
  outline: 1px solid var(--color-ink-3);
  outline-offset: -4px;
  border-radius: 9999px;
}
</style>
