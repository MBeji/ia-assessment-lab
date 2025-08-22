const CACHE_NAME = 'synapflow-cache-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(()=> self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(()=> self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith((async () => {
    const cached = await caches.match(req);
    try {
      const netRes = await fetch(req);
      if (netRes && netRes.status === 200 && netRes.type === 'basic') {
        const clone = netRes.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
      }
      return netRes;
    } catch (err) {
      if (cached) return cached;
      // For SPA navigations, fall back to cached shell if available
      if (req.mode === 'navigate') {
        const shell = await caches.match('/index.html');
        if (shell) return shell;
      }
      return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
    }
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
