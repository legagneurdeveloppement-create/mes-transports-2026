-- 1. DROP THE TRIGGER (Désactiver l'automatisme)
-- Cela nous permet de voir si c'est lui qui bloquait l'inscription
drop trigger if exists on_auth_user_created on auth.users;

-- 2. CHECK USERS (Vérifier s'il y a des inscrits cachés)
select count(*) as nombre_utilisateurs_inscrits from auth.users;
