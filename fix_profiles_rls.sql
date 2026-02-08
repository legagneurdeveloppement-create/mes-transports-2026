-- FIX : SUPPRESSION DES ANCIENNES POLITIQUES (si elles existent)
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Les admins peuvent tout voir" ON public.profiles;
DROP POLICY IF EXISTS "Les admins peuvent tout modifier" ON public.profiles;

-- 1. Permettre aux utilisateurs de voir leur propre profil (Indispensable pour la connexion)
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- 2. Permettre aux Admins et Super Admins de TOUT voir
CREATE POLICY "Les admins peuvent tout voir" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
  )
);

-- 3. Permettre aux Admins et Super Admins de TOUT modifier (Approbation, Rôle)
CREATE POLICY "Les admins peuvent tout modifier" 
ON public.profiles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
  )
);

-- Note: On utilise EXECS SELECT 1 pour éviter la récursion infinie 
-- (le moteur de politique ne doit pas s'interroger lui-même sans fin).
