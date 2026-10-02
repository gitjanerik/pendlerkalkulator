<script setup>
import { computed, ref } from 'vue'
import { useAvganger } from '../composables/useAvganger.js'
import { klokke } from '../lib/entur.js'

const props = defineProps({ stasjon: { type: String, default: '' } })
const { tilOslo, avganger, laster, feil, oppdatert, last } = useAvganger(() => props.stasjon)

const tittel = computed(() => (tilOslo.value ? `${props.stasjon} → Oslo S` : `Oslo S → ${props.stasjon}`))
const apen = ref(false)
const foerste = computed(() => avganger.value.find((a) => !a.innstilt) ?? avganger.value[0])
const status = (a) => {
  if (a.innstilt) return { tekst: 'innstilt', varsel: true }
  if (a.forsinkelseMin >= 2) return { tekst: `+${a.forsinkelseMin} min`, varsel: true }
  return { tekst: 'i rute', varsel: false }
}
</script>

<template>
  <section v-if="stasjon" class="kort" aria-labelledby="av-tittel">
    <div class="flex items-center gap-2">
      <button type="button" class="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left" :aria-expanded="apen" aria-controls="av-innhold" @click="apen = !apen">
        <h2 id="av-tittel" class="seksjonstittel shrink-0">Neste tog</h2>
        <span class="min-w-0 truncate tabular-nums" aria-live="polite">
          <template v-if="foerste">
            <span class="font-semibold">{{ foerste.linjer[0] ?? 'Tog' }} {{ klokke(foerste.start) }}</span>
            <span class="ml-1 text-sm font-medium" :class="status(foerste).varsel ? 'text-[var(--color-warn)]' : 'text-[var(--color-ink-2)]'">{{ status(foerste).tekst }}</span>
          </template>
          <span v-else class="text-sm text-[var(--color-ink-2)]">{{ laster ? 'Henter …' : feil ? 'Ingen data' : '' }}</span>
        </span>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="ml-auto shrink-0 transition-transform" :class="{ 'rotate-180': apen }"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      <button type="button" class="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-[var(--color-app)] disabled:opacity-50" aria-label="Oppdater avganger" :disabled="laster" @click="last">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" :class="{ 'animate-spin': laster }"><path d="M20 12a8 8 0 1 1-2.5-5.8" /><path d="M20 4v5h-5" /></svg>
      </button>
    </div>
    <div v-show="apen" id="av-innhold">
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
    </div>
  </section>
</template>
