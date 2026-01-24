// Service Worker v2 - Forced update to fix blank page issues
const CACHE_NAME = 'mes-transports-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/logo.jpg'
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force update
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Network first strategy for faster updates
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
