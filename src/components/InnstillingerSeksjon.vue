<script setup>
import PrefBryter from './PrefBryter.vue'

const m = defineModel({ type: Object })

const leggFerie = () => m.value.ferie.push({ fra: '', til: '' })
const fjernFerie = (i) => m.value.ferie.splice(i, 1)
</script>

<template>
  <section aria-labelledby="innstillinger" class="kort flex flex-col gap-2">
    <h2 id="innstillinger" class="text-xl font-semibold">Innstillinger</h2>

    <div class="divide-y divide-[var(--color-line)]">
      <PrefBryter
        v-model="m.innstillinger.jobberPaaskeMandagOnsdag"
        tittel="Jobber i påske mandag–onsdag"
        tekst="Skjærtorsdag, langfredag og 1.–2. påskedag er alltid fri."
      />
      <PrefBryter
        v-model="m.innstillinger.jobberRomjul"
        tittel="Jobber i romjul"
        tekst="27.–31. desember. Julaften er alltid fri."
      />
      <PrefBryter
        v-model="m.inkluderAarskort"
        tittel="Vurder årskort"
        tekst="Et årskort binder deg i 12 måneder."
      />
      <PrefBryter
        v-model="m.prisokning.paa"
        tittel="Prisøkning hver 1. februar"
        tekst="Regn med at prisene stiger etter at du har lagt dem inn."
      />
    </div>

    <div v-if="m.prisokning.paa" class="grid grid-cols-2 gap-3 pt-2">
      <div>
        <label class="etikett" for="prosent">Økning (%)</label>
        <input id="prosent" v-model.number="m.prisokning.prosent" class="felt" type="number" inputmode="decimal" min="0" step="0.1" />
      </div>
      <div>
        <label class="etikett" for="prisdato">Prisene gjelder fra</label>
        <input id="prisdato" v-model="m.prisDato" class="felt" type="date" />
      </div>
    </div>

    <h3 class="mt-4 font-semibold">Ferie og fridager</h3>
    <ul class="flex flex-col gap-2">
      <li v-for="(f, i) in m.ferie" :key="i" class="flex items-center gap-2">
        <input v-model="f.fra" class="felt" type="date" :aria-label="`Ferie ${i + 1}, fra`" />
        <span aria-hidden="true">–</span>
        <input v-model="f.til" class="felt" type="date" :aria-label="`Ferie ${i + 1}, til`" />
        <button type="button" class="knapp px-3" :aria-label="`Fjern ferie ${i + 1}`" @click="fjernFerie(i)">✕</button>
      </li>
    </ul>
    <button type="button" class="knapp self-start" @click="leggFerie">+ Legg til ferie</button>
  </section>
</template>
