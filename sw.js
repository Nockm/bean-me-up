// Bump this version when changing the offline shell or caching behaviour.
const CACHE = 'bean-me-up-v6';
const BASE = new URL('./', self.location.href);
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'coffees.json',
  'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('bean-me-up-') && name !== CACHE)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  const path = url.pathname.slice(BASE.pathname.length);
  if (!SHELL.includes(path || './') && !/^coffees\/[^/]+\/[^/]+$/.test(path)) return;

  // Prefer current content online; retain the last successful copy for offline use.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        // A full storage quota must not prevent an online response being displayed.
        try { await cache.put(event.request, response.clone()); } catch {}
      }
      return response;
    } catch {
      const saved = await cache.match(event.request);
      if (saved) return saved;
      if (event.request.mode === 'navigate') {
        const page = await cache.match(new URL('index.html', BASE).href);
        if (page) return page;
      }
      return Response.error();
    }
  })());
});
