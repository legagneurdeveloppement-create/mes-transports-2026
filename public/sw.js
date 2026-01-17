// Minimal Service Worker to satisfy PWA installation requirements
const CACHE_NAME = 'mes-transports-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/logo.jpg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
