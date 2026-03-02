const CACHE_NAME = 'aac-polish-v1';

// Local files to cache
const LOCAL_FILES = [
    './',
    './index.html',
    './app.js',
    './data.json',
    './manifest.json',
    './icon-192.svg',
    './icon-512.svg'
];

// External CDN resources to cache
const CDN_URLS = [
    'https://esm.sh/preact',
    'https://esm.sh/preact/hooks',
    'https://esm.sh/htm',
    'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Baloo+2:wght@500;600;700&display=swap'
];

// Install event - cache local files and prefetch CDN resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                // Cache local files
                const localPromise = cache.addAll(LOCAL_FILES);
                
                // Try to cache CDN resources (may fail if offline)
                const cdnPromises = CDN_URLS.map(url => 
                    fetch(url, { mode: 'cors' })
                        .then(response => {
                            if (response.ok) {
                                return cache.put(url, response);
                            }
                        })
                        .catch(() => {
                            // Ignore failures - will be cached on first use
                            console.log('Could not pre-cache:', url);
                        })
                );
                
                return Promise.all([localPromise, ...cdnPromises]);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Not in cache - fetch from network and cache
                return fetch(request)
                    .then((networkResponse) => {
                        // Only cache successful responses
                        if (!networkResponse || networkResponse.status !== 200) {
                            return networkResponse;
                        }
                        
                        // Clone response for caching
                        const responseToCache = networkResponse.clone();
                        
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(request, responseToCache);
                            });
                        
                        return networkResponse;
                    })
                    .catch(() => {
                        // Network failed and not in cache
                        // Return offline fallback for navigation requests
                        if (request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});
