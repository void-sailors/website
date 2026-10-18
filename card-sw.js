/* VoidSailors — offline copy of the pocket card (card.html) for the home-screen app.
   Scope is /card only, so the rest of the site is never cached here.
   Always tries the network first, so a site update shows up the next time the card opens with a signal.
   Bump VERSION when the list below changes. */
const VERSION = "vs-card-20261018b";
const FILES = [
  "card.html",
  "card.webmanifest",
  "assets/css/site.css?v=20261015b",
  "assets/css/card.css?v=20261018b",
  "assets/js/site.js?v=20261016b",
  "assets/js/card.js?v=20261018a",
  "assets/fonts/cinzel.woff2",
  "assets/fonts/bluu-next-titling.woff2",
  "assets/fonts/source-serif-4.woff2",
  "assets/img/web/cover-320.webp",
  "assets/img/web/cover-484.webp",
  "assets/img/web/logo-96.webp",
  "assets/img/web/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("vs-card-") && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: req.mode === "navigate" })
        .then((hit) => hit || (req.mode === "navigate" ? caches.match("card.html") : Response.error())))
  );
});
