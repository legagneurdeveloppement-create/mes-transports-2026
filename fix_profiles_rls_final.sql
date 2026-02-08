-- 1. On nettoie tout ce qui pourrait exister
DROP POLICY IF EXISTS "Admins can do everything" ON public.profiles;
DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- 2. On crée de nouvelles règles propres
-- Autorise l'admin à voir et modifier tout le monde
CREATE POLICY "Admins can do everything" ON public.profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
  )
);

-- Autorise chaque utilisateur à voir son propre profil (pour la connexion)
CREATE POLICY "Users can see own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);
