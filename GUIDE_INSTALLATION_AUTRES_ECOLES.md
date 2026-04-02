# Guide d'Installation de l'Application pour une Nouvelle École

Ce guide explique étape par étape comment déployer votre propre instance de l'application de gestion de transports. En suivant ces étapes, vous disposerez de votre propre base de données, sécurisée et totalement isolée.

---

## 🚀 Étape 1 : Création de la Base de Données (Supabase)

Supabase est la plateforme qui gère la base de données, l'authentification des utilisateurs et le système des notifications (Edge Functions).

1. Allez sur [Supabase](https://supabase.com/) et créez un compte gratuit.
2. Cliquez sur **"New Project"** et remplissez les informations :
   - Nom de l'organisation : (le nom de votre école)
   - Nom du projet : **Mes Transports**
   - Mot de passe de la base de données : Générez-en un de manière sécurisée (vous pouvez le conserver de côté).
   - Région : Choisissez celle la plus proche de chez vous (ex: Francfort ou Paris).
3. Attendez quelques minutes que le projet s'initialise.

### 1.1 Initialisation de la structure de données
1. Sur le tableau de bord Supabase, allez dans la section **"SQL Editor"** (menu de gauche).
2. Cliquez sur **"New Query"**.
3. Copiez le contenu de vos fichiers `.sql` de base (principalement le fichier `supabase_schema.sql` et toutes les éventuelles migrations/réparations comme `migration_fix.sql`).
4. Collez le code SQL et cliquez sur **"Run"** en bas à droite pour créer toutes les tables (`profiles`, `transports`, etc.) et les sécurités (RLS).

### 1.2 Configuration de l'Authentification (Email)
1. Allez dans la section **"Authentication"** -> **"Providers"**.
2. Par défaut, **Email** est activé. 
3. *Note : Si vous ne voulez pas obliger les utilisateurs à devoir cliquer sur un e-mail de confirmation pour se connecter la première fois, décochez la case **"Confirm email"**.*

---

## 🔔 Étape 2 : Configuration des Notifications Push (Optionnel)

L'application utilise une fonctionnalité avancée (Edge Functions) pour envoyer gratuitement des notifications push aux chauffeurs et administrateurs.

1. **Générer des clés VAPID** :
   - Vous devez générer des clés `VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY`.
   - Utilisez un outil en ligne ou une commande npx (`npx web-push generate-vapid-keys`) pour générer ce couple de clés.

2. **Ajouter les clés dans Supabase** :
   - Vous devez déployer la fonction `send-push` située dans `supabase/functions/send-push/` en utilisant l'outil en ligne de commande de Supabase (`supabase functions deploy send-push`).
   - Ajoutez ensuite le Secret associé dans Supabase avec la commande :
     `supabase secrets set VAPID_PRIVATE_KEY=votre_cle_privee` et `supabase secrets set VAPID_SUBJECT=mailto:votre_email@ecole.fr`.

*(Consultez le fichier `GUIDE_NOTIFICATIONS_PUSH.md` joint au projet pour plus de détails techniques).*

---

## 🌐 Étape 3 : Déploiement du Site Web (Vercel)

Vercel hébergera gratuitement votre application web (frontend) et la rendra accessible depuis n'importe quel ordinateur ou téléphone via une adresse (URL).

1. Hébergez le code source de l'application sur un dépôt privé sur **GitHub** (https://github.com/).
2. Allez sur [Vercel](https://vercel.com/) et créez un compte gratuit (en vous connectant avec votre GitHub).
3. Cliquez sur **"Add New..."** -> **"Project"**.
4. Importez le dépôt GitHub contenant le code de l'application "Mes Transports".

### 3.1 Ajout des Variables d'Environnement
Avant de cliquer sur le bouton final de "Deploy", vous devez relier l'interface Web (Vercel) à votre base de données (Supabase).
Allez dans la section **"Environment Variables"** de Vercel et ajoutez les 3 variables suivantes :

- `VITE_SUPABASE_URL` : L'URL de votre projet Supabase (que vous trouvez dans Project Settings -> API sur Supabase).
- `VITE_SUPABASE_ANON_KEY` : La clé "anon / public" de votre projet Supabase (dans Project Settings -> API).
- `VITE_VAPID_PUBLIC_KEY` : La clé publique générée à l'Étape 2 (pour les notifications).

5. Une fois les variables ajoutées, cliquez sur **"Deploy"**.
6. Patientez 1 à 2 minutes. Votre site est désormais en ligne !

---

## 👑 Étape 4 : Lancement et Premier Administrateur

1. Ouvrez l'URL de votre nouvelle application (Vercel vous donnera un lien du style `https://mon-appli-transports.vercel.app`).
2. Vous pouvez l'installer en tant qu'application sur le téléphone de vos utilisateurs (Ajouter à l'écran d'accueil).
3. **Le premier compte qui sera créé** avec la page "Inscription" sera **automatiquement promu au rang de Super Administrateur**.
4. Une fois connecté, vous pourrez, via le menu Administrateur, commencer à ajouter des chauffeurs, des transports et inviter d'autres utilisateurs.

---
**Félicitations, votre application est prête à l'emploi !** 🎉
