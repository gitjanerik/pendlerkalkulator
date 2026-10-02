import { ref, watch } from 'vue'

const les = (nokkel, standard) => {
  try {
    return localStorage.getItem(nokkel) ?? standard
  } catch {
    return standard
  }
}
const skriv = (nokkel, verdi) => {
  try {
    localStorage.setItem(nokkel, String(verdi))
  } catch {
    // Lagring er en bekvemmelighet.
  }
}

const tema = ref(['lys', 'mork'].includes(les('pendler-tema', 'auto')) ? les('pendler-tema', 'auto') : 'auto')
const skala = ref(Math.min(Math.max(Number(les('pendler-skala', '100')) || 100, 100), 200))

function bruk() {
  const rot = document.documentElement
  if (tema.value === 'auto') rot.removeAttribute('data-theme')
  else rot.dataset.theme = tema.value
  rot.style.fontSize = `${skala.value}%`
  // Statuslinja leser den faktiske bakgrunnen, ikke en tabell.
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = getComputedStyle(document.body).backgroundColor
}

let startet = false
export function useTema() {
  if (!startet) {
    startet = true
    watch(tema, (v) => (skriv('pendler-tema', v), bruk()), { immediate: true })
    watch(skala, (v) => (skriv('pendler-skala', v), bruk()))
    window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', bruk)
  }
  return { tema, skala }
}
