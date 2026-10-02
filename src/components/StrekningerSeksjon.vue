<script setup>
const strekninger = defineModel({ type: Array })

const id = () => globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random())

const legg = () =>
  strekninger.value.push({
    id: id(),
    navn: '',
    bil: false,
    enkelt: '',
    perioder: [
      { dager: 7, pris: '' },
      { dager: 30, pris: '' },
    ],
  })
const fjern = (i) => strekninger.value.splice(i, 1)
const leggPeriode = (s) => s.perioder.push({ dager: '', pris: '' })
const fjernPeriode = (s, i) => s.perioder.splice(i, 1)
</script>

<template>
  <section aria-labelledby="strekninger" class="flex flex-col gap-3">
    <h2 id="strekninger" class="text-xl font-semibold">Strekninger og priser</h2>
    <p class="text-sm text-[var(--color-ink-2)]">
      Legg inn prisene du ser hos Vy eller Ruter. Har du flere måter å komme deg til jobb på, legger
      du inn hver for seg; appen velger billigst.
    </p>

    <fieldset v-for="(s, i) in strekninger" :key="s.id" class="kort flex flex-col gap-4">
      <legend class="sr-only">Strekning {{ i + 1 }}</legend>
      <div class="flex items-end gap-2">
        <div class="flex-1">
          <label class="etikett" :for="`navn-${s.id}`">Navn</label>
          <input :id="`navn-${s.id}`" v-model="s.navn" class="felt" placeholder="F.eks. Drammen–Oslo S" />
        </div>
        <button
          v-if="strekninger.length > 1"
          type="button"
          class="knapp"
          :aria-label="`Fjern ${s.navn || 'strekning ' + (i + 1)}`"
          @click="fjern(i)"
        >
          Fjern
        </button>
      </div>

      <div>
        <label class="etikett" :for="`enkelt-${s.id}`">Enkeltbillett (kr)</label>
        <input :id="`enkelt-${s.id}`" v-model="s.enkelt" class="felt" type="number" inputmode="decimal" min="0" placeholder="0 = ikke aktuell" />
      </div>

      <div>
        <p class="etikett">Periodebilletter</p>
        <ul class="flex flex-col gap-2">
          <li v-for="(p, j) in s.perioder" :key="j" class="flex items-center gap-2">
            <input v-model="p.dager" class="felt max-w-24" type="number" inputmode="numeric" min="1" :aria-label="`Antall dager, periodebillett ${j + 1}`" placeholder="Dager" />
            <span class="text-sm text-[var(--color-ink-2)]">dager</span>
            <input v-model="p.pris" class="felt" type="number" inputmode="decimal" min="0" :aria-label="`Pris i kroner, periodebillett ${j + 1}`" placeholder="Pris kr" />
            <button type="button" class="knapp px-3" :aria-label="`Fjern periodebillett ${j + 1}`" @click="fjernPeriode(s, j)">✕</button>
          </li>
        </ul>
        <button type="button" class="knapp mt-2" @click="leggPeriode(s)">+ Periodebillett</button>
      </div>

      <label class="flex min-h-11 items-center gap-3">
        <input v-model="s.bil" type="checkbox" class="h-5 w-5 accent-[var(--color-accent)]" />
        <span>
          Krever bil
          <span class="block text-sm text-[var(--color-ink-2)]">Kan bare brukes på dager du har bil.</span>
        </span>
      </label>
    </fieldset>

    <button type="button" class="knapp self-start" @click="legg">+ Ny strekning</button>
  </section>
</template>
