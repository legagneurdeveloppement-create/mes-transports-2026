-- Vérifier si l'utilisateur existe dans la table technique de Supabase (Auth)
SELECT id, email, email_confirmed_at, last_sign_in_at 
FROM auth.users 
WHERE email = 'ec-el-manlay-21@ac-dijon.fr';

-- Si le résultat est vide, l'utilisateur n'a jamais été réellement créé dans l'authentification.
-- Dans ce cas, il faut retourner sur la page d'inscription.
