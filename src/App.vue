<script setup>
import { APP_VERSION } from './version.js'
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-10">
    <header>
      <p class="text-sm font-medium tracking-wide text-[var(--color-accent)] uppercase">
        Pendlerkalkulator
      </p>
      <h1 class="mt-1 text-3xl leading-tight font-semibold">Billigste billettkjede</h1>
      <p class="mt-2 text-[var(--color-ink-2)]">
        Finn rekkefølgen av 7-, 30- og 365-dagersbilletter som dekker arbeidsreisen din billigst.
      </p>
    </header>

    <section
      class="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
      aria-labelledby="status"
    >
      <h2 id="status" class="font-medium">Under bygging</h2>
      <p class="mt-1 text-sm text-[var(--color-ink-2)]">
        Optimerer, kalender og innstillinger kommer i neste leveranser.
      </p>
    </section>

    <footer class="mt-auto text-xs text-[var(--color-ink-2)]">v{{ APP_VERSION }}</footer>
  </main>
</template>
