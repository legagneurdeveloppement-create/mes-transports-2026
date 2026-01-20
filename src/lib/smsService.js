/**
 * Service de simulation d'envoi de SMS.
 * Dans un environnement de production, ce service utiliserait une API comme Twilio.
 */

export const smsService = {
    /**
     * Envoie un SMS à un ou plusieurs destinataires.
     * @param {string|string[]} to - Le(s) numéro(s) de téléphone destinataire(s).
     * @param {string} message - Le contenu du message.
     * @returns {Promise<boolean>} - Résultat de l'envoi.
     */
    sendSMS: async (to, message) => {
        // Simulation d'un délai réseau
        await new Promise(resolve => setTimeout(resolve, 800));

        const recipients = Array.isArray(to) ? to : [to];
        const validRecipients = recipients.filter(phone => phone && phone.trim().length > 0);

        if (validRecipients.length === 0) {
            console.warn('[SMS Service] Aucun destinataire valide.');
            return false;
        }

        console.group('📱 [SMS SIMULATION] Envoi de SMS');
        console.log('Destinataires:', validRecipients.join(', '));
        console.log('Message:', message);
        console.log('Statut: SUCCÈS (Simulé)');
        console.groupEnd();

        // En production, on ferait ici un appel API :
        // await fetch('https://api.twilio.com/...', { ... })

        return true;
    }
};
