import { ref } from 'vue'

// Delt tilstand: Chrome sender beforeinstallprompt én gang, ofte før Vue er lastet.
// index.html fanger den på window; her leser vi den og lytter på senere fyringer.
const canInstall = ref(false)
const isInstalled = ref(false)
const isIOS = ref(false)
let utsatt = null

const fang = (e) => {
  utsatt = e
  canInstall.value = true
}

let startet = false
function init() {
  if (startet || typeof window === 'undefined') return
  startet = true
  const ua = navigator.userAgent || ''
  // iPadOS melder seg som Macintosh, men har berøring
  isIOS.value = (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1)) && !window.MSStream
  isInstalled.value = !!(window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone || window.__appInstalled)
  if (window.__deferredInstallPrompt) fang(window.__deferredInstallPrompt)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    window.__deferredInstallPrompt = e
    fang(e)
  })
  window.addEventListener('appinstalled', () => {
    utsatt = null
    canInstall.value = false
    isInstalled.value = true
  })
}

async function installer() {
  if (!utsatt) return { outcome: 'unavailable' }
  const hendelse = utsatt
  utsatt = null
  canInstall.value = false
  hendelse.prompt()
  try {
    return await hendelse.userChoice
  } catch {
    return { outcome: 'dismissed' }
  }
}

// kanTilbys: noe å tilby (Android/desktop-prompt, eller manuell veiledning på iOS)
export function usePwaInstall() {
  init()
  return { canInstall, isInstalled, isIOS, installer }
}
