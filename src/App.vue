<script setup>
import { computed, ref } from "vue";
import { useModell } from "./composables/useModell.js";
import { useTema } from "./composables/useTema.js";
import { MONSTER } from "./lib/dagmonster.js";
import Estimat from "./components/Estimat.vue";
import PrefBryter from "./components/PrefBryter.vue";
import MenyKnapp from "./components/MenyKnapp.vue";
import AppMeny from "./components/AppMeny.vue";
import Oppsett from "./components/Oppsett.vue";
import AvgangerKort from "./components/AvgangerKort.vue";
import PeriodeValg from "./components/PeriodeValg.vue";
import DagerPerUke from "./components/DagerPerUke.vue";
import Hovedtall from "./components/Hovedtall.vue";
import SammenlignGraf from "./components/SammenlignGraf.vue";
import BillettTidslinje from "./components/BillettTidslinje.vue";
import FritidKort from "./components/FritidKort.vue";
import MonsterGraf from "./components/MonsterGraf.vue";
import { kr, norskTidspunkt } from "./lib/format.js";

useTema();
const { modell, utfall, monster, nullstill, startKlokke, utdatert, oppdaterNa } = useModell();
const menyApen = ref(false);
const strekning = computed(() => modell.strekninger[0]?.navn.replace("–", " – ") ?? "");
const MAANEDER = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];
const langDato = (iso) => `${Number(iso.slice(8))}. ${MAANEDER[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const klokkeskifter = computed(() => {
  const grupper = [
    { retning: "sommertid", tittel: "Overgang til sommertid", dato: new Map() },
    { retning: "vintertid", tittel: "Overgang til vintertid", dato: new Map() },
  ];
  for (const v of utfall.value.varsler) {
    if (!v.retning) continue
    const g = grupper.find((x) => x.retning === v.retning)
    g.dato.set(v.dato, [...(g.dato.get(v.dato) ?? []), v.billett.dager])
  }
  return grupper
    .filter((g) => g.dato.size)
    .map((g) => ({
      ...g,
      rader: [...g.dato].sort().map(([dato, dager]) => `${langDato(dato)} (${[...new Set(dager)].join(" og ")}-dagersbillett)`),
    }))
});
const stasjon = computed(() => modell.strekninger[0]?.navn.split("–")[0] ?? "");
const ferdig = () => {
  modell.oppsettFerdig = true;
  modell.infoLukket = false;
  window.scrollTo({ top: 0 });
};
const settDager = (n) => (modell.jobbUkedager = [...MONSTER[n]]);
</script>

<template>
  <header
    class="sticky top-0 z-10 border-b border-[var(--color-line)] bg-[var(--color-app)]"
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

  <main class="mx-auto flex max-w-xl flex-col gap-4 px-4 py-4 pb-12">
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
          class="absolute right-0.5 top-0.5 grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-black/10"
          aria-label="Lukk tipset"
          @click="modell.infoLukket = true"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </aside>
      <AvgangerKort v-if="modell.oppsettFerdig" :stasjon="stasjon" />
      <PeriodeValg v-model="modell" :start-klokke="startKlokke" :utdatert="utdatert" @oppdater-na="oppdaterNa" />
      <DagerPerUke v-model="modell" />

      <p v-if="utfall.feil" class="kort text-[var(--color-bad)]" role="alert">
        {{ utfall.feil }}
      </p>
      <template v-else>
        <Hovedtall :utfall="utfall" />
        <SammenlignGraf :utfall="utfall" />
        <BillettTidslinje :utfall="utfall" />
        <FritidKort :utfall="utfall" :stasjon="stasjon" />
        <MonsterGraf
          :monster="monster"
          :antall="modell.jobbUkedager.length"
          :prosent="utfall.prisokningProsent"
          @velg="settDager"
        />

        <section
          v-if="klokkeskifter.length"
          class="kort flex flex-col gap-3 text-sm text-[var(--color-warn)]"
          aria-labelledby="ks-tittel"
        >
          <p id="ks-tittel">
            ⚠ Klokkeskifte kan flytte utløpet av billetter med én time:
          </p>
          <div v-for="g in klokkeskifter" :key="g.retning">
            <h3 class="font-semibold">{{ g.tittel }}</h3>
            <ul class="mt-1 list-disc pl-5">
              <li v-for="r in g.rader" :key="r">{{ r }}</li>
            </ul>
          </div>
        </section>
        <section
          v-if="utfall.aarskort?.besparelse != null"
          class="kort text-sm text-[var(--color-ink-2)]"
        >
          <p v-if="utfall.aarskort.lonnerSeg">
            Årskort sparer deg {{ kr(utfall.aarskort.besparelse) }}<Estimat v-if="utfall.aarskort.estimert" /> i perioden.
          </p>
          <p v-else>Årskort lønner seg ikke for denne perioden.</p>
          <p v-if="utfall.aarskort.estimert" class="mt-1 text-xs">
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
    @nullstill="nullstill"
  />
</template>
