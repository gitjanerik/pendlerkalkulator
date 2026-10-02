<script setup>
import { APP_VERSION } from './version.js'
import { useModell } from './composables/useModell.js'
import ResultatSeksjon from './components/ResultatSeksjon.vue'
import StrekningerSeksjon from './components/StrekningerSeksjon.vue'
import PeriodeSeksjon from './components/PeriodeSeksjon.vue'
import InnstillingerSeksjon from './components/InnstillingerSeksjon.vue'

const { modell, utfall, nullstill } = useModell()
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-8">
    <header>
      <p class="text-sm font-medium tracking-wide text-[var(--color-accent)] uppercase">
        Pendlerkalkulator
      </p>
      <h1 class="mt-1 text-3xl leading-tight font-semibold">Billigste billettkjede</h1>
      <p class="mt-2 text-[var(--color-ink-2)]">
        Hvilke 7-, 30- og 365-dagersbilletter dekker arbeidsreisen din billigst? Prisene under er et
        eksempel – skriv inn dine egne.
      </p>
    </header>

    <ResultatSeksjon :utfall="utfall" />
    <StrekningerSeksjon v-model="modell.strekninger" />
    <PeriodeSeksjon v-model="modell" />
    <InnstillingerSeksjon v-model="modell" />

    <footer class="mt-auto flex items-center justify-between pt-4 text-xs text-[var(--color-ink-2)]">
      <span>v{{ APP_VERSION }} · Lagres bare i denne nettleseren</span>
      <button type="button" class="knapp" @click="nullstill">Nullstill</button>
    </footer>
  </main>
</template>
