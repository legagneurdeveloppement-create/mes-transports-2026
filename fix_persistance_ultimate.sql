-- 1. On nettoie TOUT pour être sûr de repartir sur du propre
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;

-- 2. Règle de LECTURE : Tout le monde peut voir les profils
CREATE POLICY "profiles_read_all" ON public.profiles
FOR SELECT TO authenticated USING (true);

-- 3. Règle de MODIFICATION : Autorise les Admins via les métadonnées du compte
-- Note: On vérifie l'information directement dans le Jeton (JWT) pour éviter les boucles infinies
CREATE POLICY "profiles_admin_modify" ON public.profiles
FOR ALL TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' IN ('ADMIN', 'SUPER_ADMIN'))
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role' IN ('ADMIN', 'SUPER_ADMIN'))
);

-- 4. Synchronisation forcée des métadonnées pour votre compte (au cas où)
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "SUPER_ADMIN"}'::jsonb
WHERE email = 'ec-el-manlay-21@ac-dijon.fr';
