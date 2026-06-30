// ─── CHANGE THIS VERSION ON EVERY DEPLOYMENT ──────────────
const CACHE_VERSION = 'v2026-06-30-05'; // ✅ INCREMENT this each deployment
const CACHE_NAME = `purveyols-${CACHE_VERSION}`;
const RUNTIME_CACHE = `purveyols-runtime-${CACHE_VERSION}`;

// ─── Static assets to cache immediately ──────────────────────
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo-branding.jpg',
  '/project-placeholder.jpg',
  '/notification.mp3',
  '/offline.html',
  '/app-icon.jpeg',
];

// ─── Install – cache static assets & force activation ────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log(`📦 Caching static assets (${CACHE_VERSION})...`);
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // ✅ Force the waiting service worker to become active
        self.skipWaiting();
      })
  );
});

// ─── Activate – clean old caches & take control ──────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // 1️⃣ Delete old caches
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== RUNTIME_CACHE)
            .map((key) => {
              console.log(`🗑️ Deleting old cache: ${key}`);
              return caches.delete(key);
            })
        );
      }),
      // 2️⃣ Unregister any old service workers (self cleanup)
      self.registration.unregister().catch(() => {}),
    ])
    .then(() => {
      // ✅ Take control of all clients immediately
      return self.clients.claim();
    })
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
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('📡 Serving API from cache:', url.pathname);
              return cachedResponse;
            }
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
            if (request.headers.get('Accept')?.includes('text/html')) {
              return caches.match('/offline.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});