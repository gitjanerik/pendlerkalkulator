<script setup>
import { computed, nextTick, ref } from "vue";
import { useModell } from "./composables/useModell.js";
import { useTema } from "./composables/useTema.js";
import { MONSTER } from "./lib/dagmonster.js";
import Estimat from "./components/Estimat.vue";
import PrefBryter from "./components/PrefBryter.vue";
import MenyKnapp from "./components/MenyKnapp.vue";
import AppMeny from "./components/AppMeny.vue";
import Oppsett from "./components/Oppsett.vue";
import PeriodeValg from "./components/PeriodeValg.vue";
import DagerPerUke from "./components/DagerPerUke.vue";
import Hovedtall from "./components/Hovedtall.vue";
import SammenlignGraf from "./components/SammenlignGraf.vue";
import BillettTidslinje from "./components/BillettTidslinje.vue";
import FritidKort from "./components/FritidKort.vue";
import MonsterGraf from "./components/MonsterGraf.vue";
import Varsel from "./components/Varsel.vue";
import { kr, norskTidspunkt } from "./lib/format.js";
import { visJanuarVarsel } from "./lib/priser.js";

useTema();
const { modell, utfall, monster, nullstill, startKlokke, utdatert, oppdaterNa, deltVarsel, idag } = useModell();
const januarVarsel = computed(() => visJanuarVarsel(modell.prisDato, modell.prisVarselLukket, idag()));
const lukkJanuar = () => {
  modell.prisVarselLukket = idag().slice(0, 4);
  fokuserInnhold();
};
const lukkDelt = () => {
  deltVarsel.value = "";
  fokuserInnhold();
};
const menyApen = ref(false);
const strekning = computed(() => modell.strekninger[0]?.navn.replace("–", " – ") ?? "");
// Knappen brukeren trykket på forsvinner når visningen skifter; fokus går til innholdet, ikke til <body>.
const fokuserInnhold = () => nextTick(() => document.getElementById("hovedinnhold")?.focus({ preventScroll: true }));
const ferdig = () => {
  modell.oppsettFerdig = true;
  modell.infoLukket = false;
  window.scrollTo({ top: 0 });
  fokuserInnhold();
};
const nullstillOgFokuser = (ogsaaStasjoner) => {
  nullstill(ogsaaStasjoner);
  window.scrollTo({ top: 0 });
  fokuserInnhold();
};
const lukkTips = () => {
  modell.infoLukket = true;
  fokuserInnhold();
};
const settDager = (n) => (modell.jobbUkedager = [...MONSTER[n]]);
</script>

<template>
  <header
    class="sticky top-0 z-20 border-b border-[var(--color-line)] bg-[var(--color-app)]"
  >
    <div class="mx-auto flex max-w-xl items-center gap-2 px-2 py-1">
      <MenyKnapp
        :apen="menyApen"
        @click="menyApen = true"
      />
      <div class="min-w-0 leading-tight">
        <h1 class="text-lg font-semibold">Pendlerkalkulator</h1>
        <p v-if="modell.oppsettFerdig && strekning" class="truncate text-sm text-[var(--color-ink-2)]">{{ strekning }}</p>
      </div>
    </div>
  </header>

  <main id="hovedinnhold" tabindex="-1" class="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4 pb-12">
    <Oppsett v-if="!modell.oppsettFerdig" v-model="modell" @klar="ferdig" />
    <div v-else class="flex flex-col gap-4">
      <!-- Snakkeboble: pila peker opp på tannhjulet (midt i 44 px-knappen, 30 px fra kanten) -->
      <aside
        v-if="!modell.infoLukket"
        class="relative -mt-1 rounded-2xl rounded-tl-sm bg-[var(--color-accent)] py-3 pl-4 pr-12 text-sm text-[var(--color-on-accent)] shadow-[0_4px_10px_-2px_rgb(0_0_0/0.3)]"
        aria-label="Tips"
      >
        <span class="absolute -top-2.5 left-1 h-0 w-0 border-x-[10px] border-b-[10px] border-x-transparent border-b-[var(--color-accent)]" aria-hidden="true"></span>
        <p class="relative">
          Ferie, fritid, hjemstasjon og priser tilpasser du i Innstillinger.
        </p>
        <button
          type="button"
          class="paa-aksent absolute right-0.5 top-0.5 grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-black/10"
          aria-label="Lukk tipset"
          @click="lukkTips"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </aside>
      <Varsel v-if="deltVarsel" lukkbar @lukk="lukkDelt">
        Åpnet delt strekning: {{ deltVarsel }}. Ferie og fritidsreiser er dine egne.
      </Varsel>
      <Varsel v-if="januarVarsel" lukkbar @lukk="lukkJanuar">
        <p>Vy og Ruter hever prisene 1. februar. Sjekk at prisene dine er oppdatert.</p>
        <button type="button" class="mt-1 min-h-11 font-medium underline" @click="menyApen = true">Åpne innstillinger</button>
      </Varsel>
      <!-- Resultatet står rett over det som styrer det, så tallet er synlig uten å rulle. -->
      <p v-if="utfall.feil" class="kort text-[var(--color-bad)]" role="alert">
        {{ utfall.feil }}
      </p>
      <Hovedtall v-else :utfall="utfall" />
      <PeriodeValg v-model="modell" :start-klokke="startKlokke" :utdatert="utdatert" @oppdater-na="oppdaterNa" />
      <DagerPerUke v-model="modell" />

      <template v-if="!utfall.feil">
        <SammenlignGraf :utfall="utfall" />
        <BillettTidslinje :utfall="utfall" />
        <FritidKort :utfall="utfall" />
        <MonsterGraf
          :monster="monster"
          :antall="modell.jobbUkedager.length"
          :prosent="utfall.prisokningProsent"
          @velg="settDager"
        />

        <section
          v-if="utfall.aarskort?.besparelse != null"
          class="kort text-sm text-[var(--color-ink-2)]"
          aria-labelledby="aar-tittel"
        >
          <h2 id="aar-tittel" class="sr-only">Årskort</h2>
          <p v-if="utfall.aarskort.lonnerSeg">
            Årskort sparer deg {{ kr(utfall.aarskort.besparelse) }}<Estimat v-if="utfall.aarskort.estimert" /> i perioden.
          </p>
          <p v-else>Årskort lønner seg ikke for denne perioden.</p>
          <p v-if="utfall.aarskort.estimert" class="mt-1 text-sm">
            * Estimat: regner med {{ utfall.prisokningProsent }} % prisøkning hver 1. februar.
          </p>
          <PrefBryter
            v-if="utfall.aarskort.lonnerSeg || modell.inkluderAarskort"
            v-model="modell.inkluderAarskort"
            tittel="Vurder årskort"
            tekst="Binder deg i 12 måneder."
          />
        </section>
        <p
          v-if="modell.jobbUkedager.length < 5"
          class="kort text-sm text-[var(--color-ink-2)]"
        >
          Reiser du under 5 dager i uka, kan Vy Smartpris bli billigere enn
          månedskort. Sjekk i Vy-appen.
        </p>
        <p
          v-if="modell.eksisterende.paa && modell.eksisterende.til"
          class="kort text-sm text-[var(--color-ink-2)]"
        >
          Din eksisterende periodebillett gjelder til
          {{
            norskTidspunkt(
              `${modell.eksisterende.til}T${modell.eksisterende.klokke}`,
            )
          }}. Beregningen starter da. Vi foreslår aldri ny billett rett
          etter utløp, men ved neste arbeidsreise. Gjelder billetten til
          fredag ettermiddag, starter den nye for eksempel mandag morgen.
        </p>
      </template>
    </div>
  </main>

  <AppMeny
    :wizard="!modell.oppsettFerdig"
    v-model:apen="menyApen"
    v-model:modell="modell"
    @nullstill="nullstillOgFokuser"
  />
</template>
