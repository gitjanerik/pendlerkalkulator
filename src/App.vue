<script setup>
import { computed, ref } from "vue";
import { useModell } from "./composables/useModell.js";
import { useTema } from "./composables/useTema.js";
import { MONSTER } from "./lib/dagmonster.js";
import MenyKnapp from "./components/MenyKnapp.vue";
import AppMeny from "./components/AppMeny.vue";
import Oppsett from "./components/Oppsett.vue";
import AvgangerKort from "./components/AvgangerKort.vue";
import PeriodeValg from "./components/PeriodeValg.vue";
import DagerPerUke from "./components/DagerPerUke.vue";
import Hovedtall from "./components/Hovedtall.vue";
import SammenlignGraf from "./components/SammenlignGraf.vue";
import BillettTidslinje from "./components/BillettTidslinje.vue";
import MonsterGraf from "./components/MonsterGraf.vue";
import { kr, norskTidspunkt } from "./lib/format.js";

useTema();
const { modell, utfall, monster, nullstill } = useModell();
const menyApen = ref(false);
const strekning = computed(() => modell.strekninger[0]?.navn.replace("–", " – ") ?? "");
const stasjon = computed(() => modell.strekninger[0]?.navn.split("–")[0] ?? "");
const ferdig = () => {
  modell.oppsettFerdig = true;
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
        v-if="modell.oppsettFerdig"
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
      <AvgangerKort v-if="modell.oppsettFerdig" :stasjon="stasjon" />
      <PeriodeValg v-model="modell" />
      <DagerPerUke v-model="modell" />

      <p v-if="utfall.feil" class="kort text-[var(--color-bad)]" role="alert">
        {{ utfall.feil }}
      </p>
      <template v-else>
        <Hovedtall :utfall="utfall" />
        <SammenlignGraf :utfall="utfall" />
        <BillettTidslinje :utfall="utfall" />
        <MonsterGraf
          :monster="monster"
          :antall="modell.jobbUkedager.length"
          @velg="settDager"
        />

        <ul
          v-if="utfall.varsler.length"
          class="kort flex flex-col gap-2 text-sm"
        >
          <li
            v-for="v in utfall.varsler"
            :key="v.tekst ?? v"
            class="text-[var(--color-warn)]"
          >
            ⚠ {{ v.tekst ?? v }}
          </li>
        </ul>
        <p
          v-if="utfall.aarskort?.besparelse != null"
          class="kort text-sm text-[var(--color-ink-2)]"
        >
          <template v-if="utfall.aarskort.lonnerSeg"
            >Årskort sparer deg {{ kr(utfall.aarskort.besparelse) }} i
            perioden.</template
          >
          <template v-else
            >Årskort lønner seg ikke for denne perioden.</template
          >
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
          }}. Beregningen starter da.
        </p>
      </template>
    </div>
  </main>

  <AppMeny
    v-if="modell.oppsettFerdig"
    v-model:apen="menyApen"
    v-model:modell="modell"
    @nullstill="nullstill"
  />
</template>
