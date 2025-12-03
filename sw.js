
// Service Worker for Kiosk Pro
const CACHE_NAME = 'kiosk-pro-v1';

// Assets to precache immediately
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest-kiosk.json',
  '/manifest-admin.json'
];

self.addEventListener('install', (event) => {
  // Force this SW to become the active service worker for the page
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Claim clients immediately so the page is controlled by the SW without reload
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategy: Cache First for Images and Fonts
  // This speeds up the heavy visual assets of the kiosk
  if (event.request.destination === 'image' || event.request.destination === 'font') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          // Check if we received a valid response.
          // Note: External images (like from ibb.co) might return an opaque response (status 0).
          // We must cache them to ensure icons work offline, even if we can't read their status.
          if (!response || (response.status !== 200 && response.type !== 'opaque')) {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
    );
    return;
  }

  // Strategy: Network First for Documents and APIs (JS, HTML, JSON)
  // Ensures admin always sees fresh data, but falls back to cache if offline
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Return valid response
        if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
          return response;
        }
        
        // Cache valid response
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // Offline Fallback
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If we are offline and don't have it cached, we could return a custom offline page here
          // For now, standard browser error or nothing
          return null;
        });
      })
  );
});
