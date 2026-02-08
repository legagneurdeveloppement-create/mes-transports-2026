-- 1. Nettoyage final des anciennes politiques
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
DROP POLICY IF EXISTS "Modification par admins" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON public.profiles;

-- 2. Règle de LECTURE : Tout utilisateur connecté peut lire les profils
CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT TO authenticated USING (true);

-- 3. Règle de MODIFICATION (UPDATE) : Uniquement pour le Super Admin
-- On utilise auth.jwt() pour une performance maximale et éviter les boucles
CREATE POLICY "profiles_update_admin" ON public.profiles
FOR UPDATE TO authenticated
USING (
  (auth.jwt() ->> 'role' = 'SUPER_ADMIN') OR
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'))
);

-- 4. Règle de SUPPRESSION (DELETE) : Uniquement pour le Super Admin
CREATE POLICY "profiles_delete_admin" ON public.profiles
FOR DELETE TO authenticated
USING (
  (auth.jwt() ->> 'role' = 'SUPER_ADMIN') OR
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'))
);
