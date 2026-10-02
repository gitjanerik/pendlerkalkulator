<script setup>
import { computed } from 'vue'
import { useAvganger } from '../composables/useAvganger.js'
import { klokke } from '../lib/entur.js'

const props = defineProps({ stasjon: { type: String, default: '' } })
const { tilOslo, avganger, laster, feil, oppdatert, last } = useAvganger(() => props.stasjon)

const tittel = computed(() => (tilOslo.value ? `${props.stasjon} → Oslo S` : `Oslo S → ${props.stasjon}`))
const status = (a) => {
  if (a.innstilt) return { tekst: 'Innstilt', varsel: true }
  if (a.forsinkelseMin >= 2) return { tekst: `+${a.forsinkelseMin} min`, varsel: true }
  return { tekst: 'I rute', varsel: false }
}
</script>

<template>
  <section v-if="stasjon" class="kort" aria-labelledby="av-tittel">
    <div class="flex items-center justify-between gap-2">
      <h2 id="av-tittel" class="seksjonstittel">Neste tog</h2>
      <button type="button" class="chip" :disabled="laster" @click="last">{{ laster ? 'Henter …' : 'Oppdater' }}</button>
    </div>
    <div class="mt-3 flex gap-2" role="group" aria-label="Retning">
      <button type="button" class="chip" :aria-pressed="tilOslo" @click="tilOslo = true">Til Oslo S</button>
      <button type="button" class="chip" :aria-pressed="!tilOslo" @click="tilOslo = false">Fra Oslo S</button>
    </div>
    <p class="etikett mt-3">{{ tittel }}</p>

    <div aria-live="polite">
      <p v-if="feil" class="text-sm text-[var(--color-warn)]">{{ feil }}</p>
      <p v-else-if="!laster && !avganger.length && oppdatert" class="text-sm text-[var(--color-ink-2)]">Ingen tog funnet akkurat nå.</p>
      <ul v-else class="flex flex-col divide-y divide-[var(--color-line)]">
        <li v-for="a in avganger" :key="a.start + a.linjer.join()" class="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2">
          <span class="text-lg font-semibold tabular-nums" :class="{ 'line-through opacity-60': a.innstilt }">
            {{ klokke(a.start) }} → {{ klokke(a.slutt) }}
          </span>
          <span class="text-sm text-[var(--color-ink-2)]">
            {{ a.linjer.join(' + ') || 'Tog' }}<template v-if="a.bytter"> · {{ a.bytter }} bytte</template>
          </span>
          <span class="ml-auto text-sm font-medium" :class="status(a).varsel ? 'text-[var(--color-warn)]' : 'text-[var(--color-ink-2)]'">
            {{ status(a).tekst }}
          </span>
        </li>
      </ul>
    </div>
    <p v-if="oppdatert" class="mt-2 text-xs text-[var(--color-ink-2)]">Oppdatert {{ klokke(oppdatert) }} · Data fra Entur</p>
  </section>
</template>
