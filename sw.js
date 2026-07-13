const CACHE_NAME = 'pc-flex-cache-v1.1.45';
const ASSETS = [
    './',
    './index.html',
    './app.js?v=1.1.45',
    './styles.css?v=1.1.45',
    './logo.png',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// Install Event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Service Worker: Caching critical assets');
            return cache.addAll(ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Activate Event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Clearing Old Cache', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event
self.addEventListener('fetch', event => {
    // Only handle local/same-origin HTTP/HTTPS GET requests
    if (event.request.method !== 'GET') return;
    
    const url = new URL(event.request.url);
    
    // Check if external (CDN scripts or fonts)
    if (url.origin !== self.location.origin) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response.status === 200) {
                        const resClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, resClone);
                        });
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }
    
    // Internal assets - Stale While Revalidate
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            const fetchPromise = fetch(event.request).then(networkResponse => {
                if (networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Return cached response if network fails
            });
            return cachedResponse || fetchPromise;
        })
    );
});

// Listen for skipWaiting messages
self.addEventListener('message', event => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
