import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { beregn, monsterAnalyse, standardModell } from '../lib/modell.js'

const NOKKEL = 'pendler-modell'

const idag = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const p2 = (n) => String(n).padStart(2, '0')
const naKlokke = () => {
  const d = new Date()
  return `${p2(d.getHours())}:${p2(d.getMinutes())}`
}

function les() {
  const standard = standardModell(idag())
  try {
    const lagret = JSON.parse(localStorage.getItem(NOKKEL))
    if (lagret?.versjon === standard.versjon) {
      // Gammel standard 00:00 er ikke et valg brukeren har gjort.
      if (lagret.fraKlokke === '00:00') lagret.fraKlokke = ''
      return { ...standard, ...lagret }
    }
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
  const na = ref(naKlokke())
  const tikk = setInterval(() => (na.value = naKlokke()), 30_000)
  onUnmounted(() => clearInterval(tikk))
  // Effektiv startklokke: valgt tid, ellers nå når start er i dag, ellers 00:00.
  const startKlokke = computed(() => modell.fraKlokke || (modell.fra === idag() ? na.value : '00:00'))
  const effektiv = computed(() => ({ ...modell, fraKlokke: startKlokke.value }))
  const utfall = computed(() => beregn(effektiv.value))
  const monster = computed(() => monsterAnalyse(effektiv.value))
  const nullstill = () => Object.assign(modell, standardModell(idag()))
  return { modell, utfall, monster, nullstill, startKlokke }
}
