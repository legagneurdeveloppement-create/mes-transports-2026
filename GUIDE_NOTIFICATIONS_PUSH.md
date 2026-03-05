# 📱 Guide Complet : Système de Notifications Push

Ce document explique comment configurer, déployer et tester le système de notifications Web Push pour l'application **Mes Transports**.

---

## 🏗️ Architecture du Système

Le système fonctionne en 4 étapes :
1.  **Abonnement** : L'utilisateur accepte les notifications dans son navigateur (PWA). Son "abonnement" (endpoint + clés) est stocké dans la table `push_subscriptions` via `pushService.js`.
2.  **Événement** : Une nouvelle notification est insérée dans la table `notifications`.
3.  **Déclencheur (Trigger SQL)** : La fonction `notify_push_on_insert()` (dans `init_push.sql`) détecte l'insertion et appelle une **Supabase Edge Function**.
4.  **Envoi** : La fonction Edge (`send-push`) récupère les abonnements correspondants et envoie le signal aux serveurs Google/Apple/Mozilla via la librairie `web-push`.

---

## 🛠️ Installation et Configuration

### 1. Clés VAPID
Les clés VAPID identifient votre serveur de notifications. Elles sont déjà générées mais voici où les trouver :
-   **Clé Publique** : `BHPj4IaJOPBJYRxKF9aUcC5IGG2EUvA30yP5tump8qR5i2kHtmEzFe4BNI17baHWUlh6JniSPjxibHKe5_juhiU` (utilisée dans le code React et la fonction Edge).
-   **Clé Privée** : `JPGWKHr_HDPPXi19d-JlgmStRxkPV0HfJbv0Zt7XB38` (gardée secrète, utilisée uniquement dans la fonction Edge).

### 2. Configuration Base de Données (SQL)
Exécutez le script situé dans `src/sql/init_push.sql` dans l'éditeur SQL de Supabase. Il va :
- Créer la table `push_subscriptions`.
- Configurer les politiques de sécurité (RLS).
- Créer le trigger qui appelle la fonction Edge lors d'une nouvelle notification.

> [!IMPORTANT]
> Dans `init_push.sql`, vérifiez que l'URL de la fonction est correcte :
> `url := 'https://votre-projet.supabase.co/functions/v1/send-push'`

### 3. Déploiement de la fonction Edge
1.  Assurez-vous d'avoir installé le [Supabase CLI](https://supabase.com/docs/guides/cli).
2.  Connectez-vous : `supabase login`
3.  Déployez la fonction :
    ```bash
    supabase functions deploy send-push --project-ref votre-id-projet
    ```
4.  **Secrets** : Configurez les variables d'environnement sur Supabase :
    ```bash
    supabase secrets set VAPID_PUBLIC_KEY=...
    supabase secrets set VAPID_PRIVATE_KEY=...
    ```

---

## 💻 Utilisation Côté Client (React)

### Activer les notifications
Dans votre composant (ex: `Login` ou `Profil`), appelez :
```javascript
import { pushService } from '../lib/pushService';

const handleEnablePush = async (user) => {
    const success = await pushService.subscribeUser(user);
    if (success) {
        alert("Notifications activées !");
    }
};
```

### Le Service Worker
Le fichier de base est `service-worker.js` (ou configuré via Vite PWA). Il doit contenir l'écouteur d'événement `push` :
```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192x192.png'
  });
});
```

---

## 🧪 Comment Tester ?

1.  **S'abonner** : Lancez l'application, connectez-vous et cliquez sur le bouton (ou déclencheur) pour activer les notifications. Acceptez la demande du navigateur.
2.  **Vérifier la DB** : Vérifiez que l'adresse (endpoint) est apparue dans la table `push_subscriptions`.
3.  **Simuler une notification** : Insérez manuellement une ligne dans la table `notifications` via l'interface Supabase :
    ```sql
    insert into public.notifications (message, user_email, target_role) 
    values ('Test de notification !', 'votre@email.com', 'CHAUFFEUR');
    ```
4.  **Succès** : Si tout est bien configuré, votre navigateur (ou téléphone) affichera la notification en quelques secondes.

---

## ❓ FAQ / Problèmes courants

- **Bouton bloqué** : Vérifiez si vous n'avez pas bloqué les notifications dans les paramètres du site (clic sur le cadenas à gauche de l'URL).
- **Service Worker non prêt** : Sur localhost, assurez-vous d'être en HTTPS ou d'utiliser Chrome qui autorise le SW sur `localhost`.
- **Erreur 403 Function** : Vérifiez que la clé `service_role` utilisée dans le trigger SQL est correcte.
