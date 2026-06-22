const CACHE_NAME = 'purveyols-v2';
const RUNTIME_CACHE = 'purveyols-runtime-v2';

// ─── Static assets to cache immediately ──────────────────────
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo-branding.jpg',
  '/project-placeholder.jpg',
  '/notification.mp3',
  '/offline.html',
];

// ─── Install – cache static assets ──────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// ─── Activate – clean old caches ─────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      );
    })
    .then(() => self.clients.claim())
  );
});

// ─── Fetch – intercept requests ──────────────────────────────
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  const url = new URL(request.url);

  // ─── API requests – network-first with cache fallback ─────
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline – serve from cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('📡 Serving API from cache:', url.pathname);
              return cachedResponse;
            }
            // No cache – return offline JSON
            return new Response(
              JSON.stringify({
                offline: true,
                message: 'You are offline. Data may be outdated.',
                timestamp: new Date().toISOString(),
              }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          });
        })
    );
    return;
  }

  // ─── Static assets – cache-first ───────────────────────────
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request)
          .then((response) => {
            const clonedResponse = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, clonedResponse);
            });
            return response;
          })
          .catch(() => {
            // For HTML pages, serve offline.html
            if (request.headers.get('Accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});
