<script setup>
import { computed, ref } from 'vue'
import { tilEtterMaaneder } from '../lib/periode.js'
import { datoerMellom, idagIso } from '../lib/dato.js'
import { norskDato } from '../lib/format.js'
import Kalender from './Kalender.vue'

const m = defineModel({ type: Object })
defineProps({ startKlokke: { type: String, default: '00:00' }, utdatert: Boolean })
defineEmits(['oppdater-na'])
const brukNa = () => (m.value.fraKlokke = '')
const automatisk = computed(() => !m.value.fraKlokke)
const hjelp = computed(() =>
  !automatisk.value
    ? 'Valgt av deg. Reiser før dette klokkeslettet regnes ikke med.'
    : m.value.fra === idagIso()
      ? 'Følger klokka nå, så reiser som allerede har gått regnes ikke med. Endre klokkeslettet hvis du for eksempel først skal fornye billetten i ettermiddag.'
      : 'Starter ved midnatt på startdatoen. Velg et klokkeslett for å begynne senere den dagen.',
)
const LENGDER = [1, 3, 6, 12, 24, 36]
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
    <div class="mt-3 flex flex-wrap items-center gap-x-2">
      <span id="pe-klokke-ledd" class="text-sm font-medium">Starter kl.</span>
      <input class="felt !w-auto" type="time" aria-labelledby="pe-klokke-ledd" :value="startKlokke" @change="m.fraKlokke = $event.target.value" />
      <button type="button" class="chip px-3" :aria-pressed="automatisk" @click="brukNa">Bruk nå</button>
      <!-- Plassen er alltid reservert, så seksjonen ikke hopper når knappen dukker opp. -->
      <button
        v-if="automatisk"
        type="button"
        class="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-[var(--color-app)]"
        :class="{ invisible: !utdatert }"
        :tabindex="utdatert ? 0 : -1"
        :aria-hidden="!utdatert"
        aria-label="Oppdater til klokka nå"
        @click="$emit('oppdater-na')"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.5-5.8" /><path d="M20 4v5h-5" /></svg>
      </button>
    </div>
    <p class="mt-1 text-sm text-[var(--color-ink-2)]">{{ hjelp }}</p>
    <p v-if="dager" class="mt-3 text-sm text-[var(--color-ink-2)]">{{ dager }} dager</p>
  </section>
</template>
