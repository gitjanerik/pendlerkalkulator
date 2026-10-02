<script setup>
import { computed } from 'vue'
import { kr, norskDato } from '../lib/format.js'
import BillettKort from './BillettKort.vue'

const props = defineProps({ utfall: Object })

const r = computed(() => props.utfall.resultat)
const enkeltAntall = computed(() => r.value.udekteDager.reduce((s, d) => s + d.antallTurer, 0))
const enkeltSum = computed(() => r.value.udekteDager.reduce((s, d) => s + d.kostnad, 0))
const beste = computed(() => props.utfall.alternativer.filter((a) => a.differanse > 0).slice(0, 3))
</script>

<template>
  <section aria-labelledby="resultat" class="flex flex-col gap-5">
    <div
      v-if="utfall.feil"
      role="status"
      class="kort border-[var(--color-warn)] text-[var(--color-warn)]"
    >
      {{ utfall.feil }}
    </div>

    <template v-else>
      <div class="kort">
        <h2 id="resultat" class="text-sm font-medium text-[var(--color-ink-2)]">Billigste kjede</h2>
        <p class="mt-1 text-5xl font-semibold tracking-tight tabular-nums">{{ kr(r.kostnad) }}</p>
        <p class="mt-2 text-sm text-[var(--color-ink-2)]">
          {{ utfall.oppsummering.turer }} reiser på {{ utfall.oppsummering.reisedager }} reisedager,
          {{ r.billetter.length }} {{ r.billetter.length === 1 ? 'billett' : 'billetter' }}<template
            v-if="enkeltAntall"
          >
            og {{ enkeltAntall }} enkeltbilletter</template
          >.
        </p>
      </div>

      <ol v-if="r.billetter.length" class="relative flex flex-col gap-3" aria-label="Billetter i kjøpsrekkefølge">
        <span
          aria-hidden="true"
          class="absolute top-4 bottom-4 left-3 w-px bg-[var(--color-line)]"
        ></span>
        <BillettKort v-for="(b, i) in r.billetter" :key="b.aktivering" :billett="b" :nr="i + 1" />
      </ol>

      <div v-if="enkeltAntall" class="kort">
        <h3 class="font-semibold">Enkeltbilletter · {{ kr(enkeltSum) }}</h3>
        <p class="text-sm text-[var(--color-ink-2)]">
          Billigere enn periodebillett disse dagene:
          {{ r.udekteDager.map((d) => norskDato(d.dato)).join(', ') }}.
        </p>
      </div>

      <div v-for="v in utfall.varsler" :key="v.dato + v.billett.aktivering" class="kort border-[var(--color-warn)] text-sm text-[var(--color-warn)]" role="note">
        {{ v.tekst }}
      </div>

      <div v-if="utfall.aarskort" class="kort">
        <h3 class="font-semibold">Årskort</h3>
        <p v-if="utfall.aarskort.lonnerSeg" class="text-sm">
          Årskort lønner seg her og sparer {{ kr(utfall.aarskort.besparelse) }}. Husk at det er en
          bindende beslutning for 12 måneder.
        </p>
        <p v-else class="text-sm text-[var(--color-ink-2)]">
          Årskort lønner seg ikke for denne perioden.
        </p>
      </div>

      <div v-if="beste.length" class="kort">
        <h3 class="font-semibold">Dyrere alternativer</h3>
        <ul class="mt-2 divide-y divide-[var(--color-line)] text-sm">
          <li v-for="a in beste" :key="a.navn" class="flex justify-between gap-3 py-2">
            <span>{{ a.navn }}</span>
            <span class="font-medium tabular-nums">+{{ kr(a.differanse) }}</span>
          </li>
        </ul>
      </div>
    </template>
  </section>
</template>
