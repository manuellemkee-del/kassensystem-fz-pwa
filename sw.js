
const CACHE_NAME = 'fz-kasse-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './index.tsx',
  './App.tsx',
  './types.ts',
  './constants.ts',
  './services/storage.ts',
  './pages/POSPage.tsx',
  './pages/pos/POSKasse.tsx',
  './pages/pos/POSBerichte.tsx',
  './pages/pos/POSVerlauf.tsx',
  './pages/pos/POSSetup.tsx',
  './pages/pos/POSKassensturz.tsx',
  './pages/pos/POSPrintView.tsx'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activate & Cleanup
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Fetch Strategy: Cache First, fallback to Network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchResponse => {
        // Cache new esm.sh imports on the fly
        if (event.request.url.includes('esm.sh') || event.request.url.includes('tailwindcss')) {
           return caches.open(CACHE_NAME).then(cache => {
             cache.put(event.request, fetchResponse.clone());
             return fetchResponse;
           });
        }
        return fetchResponse;
      });
    })
  );
});
