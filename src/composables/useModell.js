import { computed, reactive, watch } from 'vue'
import { beregn, standardModell } from '../lib/modell.js'

const NOKKEL = 'pendler-modell'

const idag = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function les() {
  const standard = standardModell(idag())
  try {
    const lagret = JSON.parse(localStorage.getItem(NOKKEL))
    if (lagret?.versjon === standard.versjon) return { ...standard, ...lagret }
  } catch {
    // Privat modus eller ødelagt innhold: start på nytt.
  }
  return standard
}

export function useModell() {
  const modell = reactive(les())
  watch(
    modell,
    () => {
      try {
        localStorage.setItem(NOKKEL, JSON.stringify(modell))
      } catch {
        // Lagring er en bekvemmelighet, ikke en forutsetning.
      }
    },
    { deep: true },
  )
  const utfall = computed(() => beregn(modell))
  const nullstill = () => Object.assign(modell, standardModell(idag()))
  return { modell, utfall, nullstill }
}
