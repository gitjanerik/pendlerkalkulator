<script setup>
import { computed } from 'vue'
import { tilEtterMaaneder } from '../lib/periode.js'
import { datoerMellom } from '../lib/dato.js'
import { norskDato } from '../lib/format.js'

const m = defineModel({ type: Object })
const LENGDER = [1, 3, 6, 12]
const maaneder = computed(() => LENGDER.find((n) => tilEtterMaaneder(m.value.fra, n) === m.value.til) ?? null)
const velg = (n) => {
  m.value.til = tilEtterMaaneder(m.value.fra, n)
}
const fraEndret = (e) => {
  const n = maaneder.value
  m.value.fra = e.target.value
  if (n && m.value.fra) m.value.til = tilEtterMaaneder(m.value.fra, n)
}
const dager = computed(() => (m.value.fra && m.value.til >= m.value.fra ? datoerMellom(m.value.fra, m.value.til).length : 0))
</script>

<template>
  <section class="kort" aria-labelledby="pe-tittel">
    <h2 id="pe-tittel" class="seksjonstittel">Periode</h2>
    <div class="mt-3 grid gap-3 sm:grid-cols-2">
      <div>
        <label class="etikett" for="pe-fra">Fra</label>
        <input id="pe-fra" type="date" class="felt" :value="m.fra" @change="fraEndret" />
      </div>
      <div>
        <p class="etikett">Lengde</p>
        <div class="flex gap-2">
          <button v-for="n in LENGDER" :key="n" type="button" class="chip px-3" :aria-pressed="maaneder === n" @click="velg(n)">
            {{ n }} mnd
          </button>
        </div>
      </div>
    </div>
    <p v-if="dager" class="mt-3 text-sm text-[var(--color-ink-2)]">Til og med {{ norskDato(m.til, true) }} · {{ dager }} dager</p>
  </section>
</template>
