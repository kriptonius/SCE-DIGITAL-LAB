const CACHE = 'estrada-builds-v2';
const ASSETS = ['/', '/index.html', '/manifest.json', '/icon.svg'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Nunca cachear los APK/artifacts: siempre ir a la red por el archivo real.
  if (e.request.url.match(/\.(apk|zip|ipa)$/)) return;
  // Solo manejar archivos propios (no fuentes ni links externos).
  if (new URL(e.request.url).origin !== self.location.origin) return;

  // Red primero: siempre trae la versión más nueva; la caché solo sirve si no hay internet.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
