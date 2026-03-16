import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = 'BHPj4IaJOPBJYRxKF9aUcC5IGG2EUvA30yP5tump8qR5i2kHtmEzFe4BNI17baHWUlh6JniSPjxibHKe5_juhiU'

export const pushService = {
    /**
     * Demande la permission et enregistre l'abonnement
     */
    subscribeUser: async (user) => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push not supported');
            return false;
        }

        try {
            // 1. Demander permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.warn('Permission denied');
                return false;
            }

            // 2. Récupérer le service worker
            const registration = await navigator.serviceWorker.ready;

            // 3. S'abonner
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            console.log('User subscribed:', subscription);

            // 4. Envoyer à Supabase
            if (user && subscription) {
                const subJSON = subscription.toJSON();
                const { error } = await supabase
                    .from('push_subscriptions')
                    .upsert({
                        user_id: user.id,
                        email: user.email,
                        role: user.role,
                        subscription: subJSON,
                        endpoint: subJSON.endpoint,
                        created_at: new Date()
                    }, { onConflict: 'endpoint' });

                if (error) throw error;
            }

            return true;
        } catch (error) {
            console.error('Push Subscription Error:', error);
            return false;
        }
    },

    /**
     * Vérifie si l'utilisateur est abonné
     */
    checkSubscription: async () => {
        if (!('serviceWorker' in navigator)) return false;
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (!registration) return false;

            // Check pushManager directly to be safe
            if (!registration.pushManager) return false;

            const subscription = await registration.pushManager.getSubscription();
            return !!subscription;
        } catch (e) {
            console.warn('Error checking push subscription:', e);
            return false;
        }
    }
};

/**
 * Helper to convert VAPID key
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
