-- ==========================================
-- NETTOYAGE COMPLET (COPIER-COLLER TOUT)
-- ==========================================

-- 1. On supprime l'ancien profil (si il existe)
DELETE FROM public.profiles 
WHERE email = 'ec-el-manlay-21@ac-dijon.fr';

-- 2. On supprime le compte technique (si il existe)
DELETE FROM auth.users 
WHERE email = 'ec-el-manlay-21@ac-dijon.fr';

-- 3. Vérification (Le résultat en bas doit être vide)
SELECT id, email 
FROM auth.users 
WHERE email = 'ec-el-manlay-21@ac-dijon.fr';

-- ==========================================
-- APRÈS avoir cliqué sur "S'inscrire" sur le site,
-- exécutez UNIQUEMENT cette ligne ci-dessous :
-- UPDATE auth.users SET email_confirmed_at = now() WHERE email = 'ec-el-manlay-21@ac-dijon.fr';
-- ==========================================
