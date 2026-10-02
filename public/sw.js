// Service worker: gjør appen installerbar og lar skallet starte uten nett.
// Entur og andre eksterne kall røres ikke.
const VERSJON = 'v1'
const CACHE = `pendler-${VERSJON}`
const BASE = '/pendlerkalkulator/'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([BASE, `${BASE}manifest.webmanifest`, `${BASE}icon-192.png`])).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((n) => Promise.all(n.filter((k) => k.startsWith('pendler-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return

  // Sider: nett først, så siste kopi uten nett
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const kopi = res.clone()
          caches.open(CACHE).then((c) => c.put(BASE, kopi))
          return res
        })
        .catch(() => caches.match(BASE)),
    )
    return
  }

  // Hashede filer og ikoner: cache først
  e.respondWith(
    caches.match(req).then(
      (treff) =>
        treff ||
        fetch(req).then((res) => {
          if (res.ok) {
            const kopi = res.clone()
            caches.open(CACHE).then((c) => c.put(req, kopi))
          }
          return res
        }),
    ),
  )
})
