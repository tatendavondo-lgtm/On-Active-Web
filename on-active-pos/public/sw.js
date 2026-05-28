const CACHE_NAME = 'oa-pos-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API/Supabase: network first, cache fallback
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          
          // If network and cache fail, return a generic error response for API
          return new Response(JSON.stringify({ error: 'Network failure' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Static/Navigation: cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      
      // For SPA navigation requests, always serve index.html so React can boot
      if (request.mode === 'navigate') {
        return caches.match('/index.html').then(indexCache => {
          return indexCache || fetch(request).catch(() => caches.match('/offline.html'));
        });
      }
      
      return fetch(request);
    })
  );
});
