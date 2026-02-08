-- 1. On s'assure que la colonne de tri existe
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 2. On répare les accès (version ultra-compatible sans récursion)
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything" ON public.profiles;

-- Règle simple : Tout le monde connecté peut voir les noms/emails pour le fonctionnement de base
CREATE POLICY "profiles_read_all" ON public.profiles
FOR SELECT TO authenticated USING (true);

-- Seul l'admin peut modifier (approuver)
CREATE POLICY "profiles_admin_update" ON public.profiles
FOR UPDATE TO authenticated
USING (
  auth.jwt() ->> 'role' = 'SUPER_ADMIN' OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
);

-- 3. On synchronise le dernier inscrit si il manque
INSERT INTO public.profiles (id, email, role, full_name, direction, phone, approved)
SELECT id, email, 'USER', raw_user_meta_data->>'full_name', raw_user_meta_data->>'direction', raw_user_meta_data->>'phone', false
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
