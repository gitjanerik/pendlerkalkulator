import { ref, watch, onMounted, onUnmounted } from 'vue'
import { finnStasjon, hentAvganger } from '../lib/entur.js'

const OSLO_S = 'Oslo S'
const NOKKEL = 'pendler-stasjoner'
const OPPDATER_MS = 60_000

const lesCache = () => {
  try {
    return JSON.parse(localStorage.getItem(NOKKEL)) ?? {}
  } catch {
    return {}
  }
}
const skrivCache = (c) => {
  try {
    localStorage.setItem(NOKKEL, JSON.stringify(c))
  } catch {
    // Cache er en bekvemmelighet.
  }
}

// Stasjons-id slås opp én gang og huskes, så vi sparer en rundtur per besøk.
async function stasjonsId(navn, signal) {
  const cache = lesCache()
  if (cache[navn]) return cache[navn]
  const s = await finnStasjon(navn, fetch, signal)
  if (!s) throw new Error(`Fant ikke stasjonen ${navn}`)
  skrivCache({ ...lesCache(), [navn]: s.id })
  return s.id
}

// stasjon: getter som gir «Asker» osv. Retning: true = til Oslo S, false = fra.
export function useAvganger(stasjon) {
  const tilOslo = ref(new Date().getHours() < 12)
  const avganger = ref([])
  const laster = ref(false)
  const feil = ref('')
  const oppdatert = ref(null)
  let kontroll = null
  let tikk = null

  async function last() {
    const navn = stasjon()
    if (!navn) return
    kontroll?.abort()
    const k = (kontroll = new AbortController())
    laster.value = true
    try {
      const [a, b] = await Promise.all([stasjonsId(navn, k.signal), stasjonsId(OSLO_S, k.signal)])
      const [fra, til] = tilOslo.value ? [a, b] : [b, a]
      const liste = await hentAvganger(fra, til, { signal: k.signal })
      if (k.signal.aborted) return
      avganger.value = liste
      feil.value = ''
      oppdatert.value = new Date().toISOString()
    } catch (e) {
      if (k.signal.aborted) return
      avganger.value = []
      feil.value = 'Fikk ikke kontakt med Entur. Prøv igjen om litt.'
    } finally {
      if (kontroll === k) laster.value = false
    }
  }

  const start = () => {
    stopp()
    tikk = setInterval(() => document.visibilityState === 'visible' && last(), OPPDATER_MS)
  }
  const stopp = () => clearInterval(tikk)
  const synlig = () => document.visibilityState === 'visible' && last()

  watch([stasjon, tilOslo], last)
  onMounted(() => {
    last()
    start()
    document.addEventListener('visibilitychange', synlig)
  })
  onUnmounted(() => {
    stopp()
    kontroll?.abort()
    document.removeEventListener('visibilitychange', synlig)
  })

  return { tilOslo, avganger, laster, feil, oppdatert, last }
}
