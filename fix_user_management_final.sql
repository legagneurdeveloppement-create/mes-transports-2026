-- 1. AJOUT DE LA COLONNE MANQUANTE (Indispensable pour le tri du tableau)
-- Le code JS essaie de trier par 'created_at', mais la colonne n'existe pas !
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 2. RESET TOTAL DES POLITIQUES RLS (On repart sur des noms propres)
DROP POLICY IF EXISTS "Admins can do everything" ON public.profiles;
DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;
DROP POLICY IF EXISTS "Lecture profils pour tous" ON public.profiles;
DROP POLICY IF EXISTS "Modification par admins" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own" ON public.profiles;

-- Règle 1 : Tout utilisateur connecté peut voir les profils (pour que fetchProfile marche)
CREATE POLICY "profiles_select_policy" 
ON public.profiles FOR SELECT 
USING (auth.role() = 'authenticated');

-- Règle 2 : Seuls les Admins et Super Admins peuvent modifier (approuver, changer le rôle)
CREATE POLICY "profiles_admin_update_policy" 
ON public.profiles FOR UPDATE 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ADMIN', 'SUPER_ADMIN')
);

-- Règle 3 : Seuls les Admins peuvent supprimer
CREATE POLICY "profiles_admin_delete_policy" 
ON public.profiles FOR DELETE 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ADMIN', 'SUPER_ADMIN')
);
