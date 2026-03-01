const CACHE_NAME = 'gemini-currency-v1';

// Install event: Activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event: Claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch event: Network first, fall back to cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests that aren't GET or are API calls we want to handle in app
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response to store in cache
        const responseClone = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          // Cache successful responses from our app or CDNs
          if (response.status === 200) {
            cache.put(event.request, responseClone);
          }
        });
        
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
      })
  );
});