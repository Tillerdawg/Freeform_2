// Offline support: serve from cache, refresh the cache in the background.
// The pages themselves (navigation) prefer the network so a new version shows up as soon as you're online.
// What to keep is listed in precache.json, written by the build (vite.config.ts): both pages, every built file (the
// editor and the performer view are separate downloads), and the icons and logos.
// Bump when a file without a hash in its name changes (icons, manifest): cached copies are otherwise kept forever.
const CACHE = 'freeform-v11'; // v11: the manifest's name is FreeFORM Drill; v10: the student quickstart (students/, es/students/); v9: the front page at /, the app at /app/, precache.json

const wanted = async () => (await fetch('./precache.json', { cache: 'no-cache' })).json();

self.addEventListener('install', (e) => {
  // Everything, so the app works offline after a single visit, whichever view that visit opened.
  e.waitUntil(wanted().then(async (list) => (await caches.open(CACHE)).addAll(list)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const save = (res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; };
  if (req.mode === 'navigate') {
    // no-cache: ask the server whether the page changed (GitHub Pages lets browsers reuse it for 10 minutes otherwise,
    // so a new version could take that long to appear). Offline, the cached page; /app/?sample and the like count as /app/.
    const page = url.pathname.includes('/app/') ? './app/' : './';
    e.respondWith(fetch(new Request(req, { cache: 'no-cache' })).then((res) => { save(res); refresh(); return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match(page))));
    return;
  }
  // Built files have content hashes in their names, so a cached copy is always the right one.
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then(save)));
});

// After an update: fetch what the new version needs (the view not opened yet included) and drop built files it no longer
// uses, so the cache neither misses a file offline nor grows with every release.
async function refresh() {
  try {
    const list = await wanted(), c = await caches.open(CACHE);
    const keep = new Set(list.map((f) => new URL(f, self.registration.scope).href));
    for (const r of await c.keys()) if (r.url.includes('/assets/') && !keep.has(r.url)) await c.delete(r);
    for (const href of keep) if (href.includes('/assets/') && !(await c.match(href))) await c.add(href).catch(() => {});
  } catch { /* offline or mid-deploy: try again next time */ }
}
