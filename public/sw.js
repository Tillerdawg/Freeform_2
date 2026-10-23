// Offline support: serve from cache, refresh the cache in the background.
// The page itself (navigation) prefers the network so a new version shows up as soon as you're online.
const CACHE = 'freeform-v1';

self.addEventListener('install', (e) => {
  // Cache the page plus every file it links (the built JS has a hashed name we can't list ahead of time),
  // so the app works offline after a single visit.
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    const html = await (await fetch('./', { cache: 'reload' })).text();
    const linked = [...html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)].map((m) => m[1]);
    await c.addAll(['./', ...new Set(linked)]);
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const save = (res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; };
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => { save(res); prune(res.clone()); return res; })
      .catch(() => caches.match(req).then((r) => r || caches.match('./'))));
    return;
  }
  // Built files have content hashes in their names, so a cached copy is always the right one.
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then(save)));
});

// After an update, drop built files the new page no longer uses, so the cache doesn't grow with every release.
async function prune(res) {
  const html = await res.text();
  const keep = new Set([...html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)].map((m) => new URL(m[1], res.url || self.registration.scope).href));
  const c = await caches.open(CACHE);
  for (const r of await c.keys()) if (r.url.includes('/assets/') && !keep.has(r.url)) await c.delete(r);
}
