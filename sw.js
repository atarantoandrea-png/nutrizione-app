const CACHE = "nutricoach-v3";
const IMG_CACHE = "nutricoach-img-v1";
const PRECACHE = ["./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks =>
      Promise.all(ks.filter(k => k !== CACHE && k !== IMG_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  // Immagini ricette: cache-first (non cambiano spesso)
  if (url.pathname.includes("/immagini/")) {
    e.respondWith(
      caches.open(IMG_CACHE).then(c =>
        c.match(e.request).then(hit => hit || fetch(e.request).then(res => {
          c.put(e.request, res.clone()).catch(() => {});
          return res;
        }))
      )
    );
    return;
  }

  // Tutto il resto (index.html, sw.js, manifest): network-first
  // → aggiornamenti visibili subito, senza reinstallare
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request))
  );
});
