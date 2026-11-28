// Network-first: always the latest version online; cached copy only when offline.
const CACHE = "bandorder-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin || !u.pathname.startsWith("/storage/")) return; // never touch Supabase / CDN / other apps
  const fresh = r.mode === "navigate" || /\/(index\.html)?$/.test(u.pathname) ? r.url + (u.search ? "&" : "?") + "_=" + Date.now() : r.url; // bust the CDN cache for the page itself
  e.respondWith(fetch(new Request(fresh, { cache: "no-store", credentials: "same-origin" }))
    .then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); return res; })
    .catch(() => caches.match(r).then(m => m || caches.match("./index.html"))));
});
