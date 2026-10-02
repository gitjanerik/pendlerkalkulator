<script setup>
import { computed, ref } from 'vue'
import { tilEtterMaaneder } from '../lib/periode.js'
import { datoerMellom } from '../lib/dato.js'
import { norskDato } from '../lib/format.js'
import Kalender from './Kalender.vue'

const m = defineModel({ type: Object })
const LENGDER = [1, 3, 6, 12]
const apen = ref(false)
const maaneder = computed(() => LENGDER.find((n) => tilEtterMaaneder(m.value.fra, n) === m.value.til) ?? null)
const velgLengde = (n) => (m.value.til = tilEtterMaaneder(m.value.fra, n))
const velgOmraade = ({ fra, til }) => {
  m.value.fra = fra
  m.value.til = til
  apen.value = false
}
const dager = computed(() => (m.value.fra && m.value.til >= m.value.fra ? datoerMellom(m.value.fra, m.value.til).length : 0))
</script>

<template>
  <section class="kort" aria-labelledby="pe-tittel">
    <h2 id="pe-tittel" class="seksjonstittel">Periode</h2>
    <button type="button" class="felt mt-3 flex items-center justify-between text-left" :aria-expanded="apen" @click="apen = !apen">
      <span class="min-w-0">{{ norskDato(m.fra) }} – {{ norskDato(m.til, true) }}</span>
      <span class="ml-2 shrink-0" aria-hidden="true">{{ apen ? '▴' : '▾' }}</span>
    </button>
    <div v-if="apen" class="mt-3 rounded-xl border border-[var(--color-line)] p-3">
      <Kalender :fra="m.fra" :til="m.til" @velg="velgOmraade" />
    </div>
    <div class="mt-3 flex flex-wrap gap-2" role="group" aria-label="Lengde fra startdato">
      <button v-for="n in LENGDER" :key="n" type="button" class="chip px-3" :aria-pressed="maaneder === n" @click="velgLengde(n)">{{ n }} mnd</button>
    </div>
    <p v-if="dager" class="mt-3 text-sm text-[var(--color-ink-2)]">{{ dager }} dager</p>
  </section>
</template>
