// Service Worker for offline support
const CACHE_NAME = 'purveyols-cache-v1';
const RUNTIME_CACHE = 'purveyols-runtime-v1';

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.jsx',
  '/src/index.css',
  '/favicon.ico',
];

// URLs to cache for offline use
const API_CACHE_URLS = [
  '/api/workers',
  '/api/projects',
  '/api/funding-requests',
  '/api/payments',
  '/api/procurement',
  '/api/boq',
  '/api/subcontracts',
  '/api/notifications',
  '/api/reports/accountant/stats',
  '/api/advertised-projects',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching assets...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return fetch(event.request);
  }

  // API requests - use network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed - try cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('📡 Serving from cache:', url.pathname);
              return cachedResponse;
            }
            // If no cache, return a custom offline response
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

  // Static assets - cache-first
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // Not in cache - fetch and cache
        return fetch(event.request)
          .then((response) => {
            const clonedResponse = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, clonedResponse);
            });
            return response;
          })
          .catch(() => {
            // For HTML pages, serve offline page
            if (event.request.headers.get('Accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});
