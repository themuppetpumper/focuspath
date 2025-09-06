// Basic offline caching service worker for FocusPath
const CACHE_NAME = 'focuspath-cache-v1';
const CORE_ASSETS = [
  'index.html',
  'flashcards.html',
  'test.html',
  'games.html',
  'dictionary.html',
  'stats.html',
  'themes.js',
  'quotes.js',
  'achievements.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // Only handle GET
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(resp => {
        // Stale-while-revalidate for same-origin
        if (resp.ok && req.url.startsWith(self.location.origin)) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
        }
        return resp;
      }).catch(() => caches.match('index.html'));
    })
  );
});
