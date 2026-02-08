-- 1. FIX RLS : Éviter l'auto-récursion infinie
DROP POLICY IF EXISTS "Admins can do everything" ON public.profiles;
DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;

-- Autorise la lecture pour tout le monde connecté (indispensable pour fetchProfile)
CREATE POLICY "Lecture profils pour tous" 
ON public.profiles FOR SELECT 
USING (auth.role() = 'authenticated');

-- Autorise les admins à modifier
CREATE POLICY "Modification par admins" 
ON public.profiles FOR UPDATE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ADMIN', 'SUPER_ADMIN')
);

-- 2. SYNC METADATA : Mettre à jour aussi le compte "technique" pour être sûr
-- Cela permet au rôle d'être présent directement dans le jeton de connexion (JWT)
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "SUPER_ADMIN"}'::jsonb
WHERE email = 'ec-el-manlay-21@ac-dijon.fr';

UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "SUPER_ADMIN"}'::jsonb
WHERE email = 'test4@demo.fr';
