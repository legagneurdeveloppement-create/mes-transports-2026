-- Force la confirmation de l'email pour vos comptes de test
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email IN ('test4@demo.fr', 'ec-el-manlay-21@ac-dijon.fr');

-- (Optionnel) Confirme TOUS les utilisateurs d'un coup pour être tranquille
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email_confirmed_at IS NULL;
