const CACHE = "shoebuilder-54f683ccbe";
const FILES = ["./","apple-touch-icon.png","assets/barlow-condensed-latin-600-normal-BN11TKSn.woff2","assets/barlow-condensed-latin-600-normal-CX7qwx3H.woff","assets/barlow-condensed-latin-700-normal-B9NQhHK3.woff2","assets/barlow-condensed-latin-700-normal-IaWpoxiT.woff","assets/ibm-plex-mono-latin-400-normal-Dm_PoFIZ.woff2","assets/ibm-plex-mono-latin-400-normal-O6-GRVqx.woff","assets/ibm-plex-mono-latin-500-normal-C_OblDzq.woff2","assets/ibm-plex-mono-latin-500-normal-zoSM89R3.woff","assets/index-ChnykTwX.css","assets/index-D_Pzqbxe.js","assets/source-sans-3-latin-400-normal-AFMiCETP.woff","assets/source-sans-3-latin-400-normal-DQi5PRDE.woff2","assets/source-sans-3-latin-600-normal-BvDVuF-j.woff","assets/source-sans-3-latin-600-normal-DeckBYAU.woff2","assets/web-C2DWEYnf.js","assets/web-CVK6IsEj.js","icon-192.png","icon-512.png","icon-maskable-512.png","index.html","manifest.webmanifest"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
