<script setup>
import { computed, ref } from 'vue'
import { parseIcs } from '../lib/ics.js'
import { norskDato } from '../lib/format.js'

const emit = defineEmits(['importer'])

// Native <dialog>: nettleseren gir fokusfelle, Esc og inert bakgrunn.
const dlg = ref(null)
const hendelser = ref([])
const valgt = ref(new Set())
const melding = ref('')
const gjentakende = ref(0)

const antallValgt = computed(() => valgt.value.size)

async function lesFil(e) {
  const fil = e.target.files?.[0]
  e.target.value = ''
  if (!fil) return
  const { hendelser: liste, gjentakende: antall } = parseIcs(await fil.text())
  hendelser.value = liste
  gjentakende.value = antall
  // Heldagshendelser er oftest ferie og fri; møter og lignende krysses av for hånd.
  valgt.value = new Set(liste.flatMap((h, i) => (h.heldag ? [i] : [])))
  melding.value = liste.length ? '' : 'Fant ingen hendelser i filen. Sjekk at du valgte en kalenderfil (.ics).'
  dlg.value.showModal()
}

function veksle(i) {
  const ny = new Set(valgt.value)
  ny.has(i) ? ny.delete(i) : ny.add(i)
  valgt.value = ny
}

function legTil() {
  emit('importer', [...valgt.value].map((i) => hendelser.value[i]))
  dlg.value.close()
}

const klikkBakgrunn = (e) => {
  if (e.target === dlg.value) dlg.value.close()
}

const periode = (h) => (h.fra === h.til ? norskDato(h.fra, true) : `${norskDato(h.fra)} – ${norskDato(h.til, true)}`)
</script>

<template>
  <div>
    <label class="knapp cursor-pointer focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-[var(--color-accent)]">
      Importer fra kalender (.ics)
      <input type="file" accept=".ics,text/calendar" class="sr-only" @change="lesFil" />
    </label>

    <dialog ref="dlg" class="bekreft bred" aria-labelledby="ics-tittel" @close="hendelser = []" @click="klikkBakgrunn">
      <div class="flex max-h-[85dvh] flex-col gap-3 p-5">
        <h2 id="ics-tittel" class="text-lg font-semibold">Velg ferie å legge til</h2>
        <p v-if="melding" class="text-sm text-[var(--color-ink-2)]">{{ melding }}</p>
        <p v-if="gjentakende" class="text-sm text-[var(--color-warn)]">
          {{ gjentakende }} gjentakende hendelser vises bare med første forekomst.
        </p>
        <ul class="-mx-1 flex-1 divide-y divide-[var(--color-line)] overflow-y-auto px-1">
          <li v-for="(h, i) in hendelser" :key="i">
            <label class="flex min-h-11 cursor-pointer items-start gap-3 py-2">
              <input type="checkbox" class="mt-1 h-5 w-5 shrink-0 accent-[var(--color-accent)]" :checked="valgt.has(i)" @change="veksle(i)" />
              <span class="min-w-0">
                <span class="block font-medium break-words">{{ h.navn }}</span>
                <span class="block text-sm text-[var(--color-ink-2)]">{{ periode(h) }}{{ h.heldag ? '' : ' · med klokkeslett' }}</span>
              </span>
            </label>
          </li>
        </ul>
        <div class="flex justify-end gap-2">
          <button type="button" class="knapp" @click="dlg.close()">Avbryt</button>
          <button type="button" class="knapp knapp-primaer" :disabled="!antallValgt" @click="legTil">
            Legg til {{ antallValgt }}
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>
