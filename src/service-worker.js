import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

// Pre-caching
precacheAndRoute(self.__WB_MANIFEST || []);

// Prompt new version immediately after skip waiting
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

clientsClaim();

// --- PUSH NOTIFICATIONS ---

self.addEventListener('push', (event) => {
    let data = { title: 'Mes Transports', body: 'Nouvelle notification' };
    if (event.data) {
        try {
            data = event.data.json();
            console.log('Push data received:', data);
        } catch {
            data = { title: 'Mes Transports', body: event.data.text() };
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/notif-bus-v2.png',
        badge: data.badge || '/notif-bus-v2.png',
        vibrate: [300, 100, 400, 100, 400, 100, 400], // Motif de vibration fort
        requireInteraction: true, // Force la notification à rester à l'écran
        silent: false, // Tente de forcer le son du système
        data: {
            url: data.url || '/dashboard'
        },
        actions: [
            { action: 'open', title: 'Ouvrir' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Si un onglet est déjà ouvert sur notre site, on lui donne le focus
                for (let client of windowClients) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Sinon, on ouvre une nouvelle fenêtre
                if (self.clients.openWindow) {
                    return self.clients.openWindow(urlToOpen);
                }
            })
    );
});
