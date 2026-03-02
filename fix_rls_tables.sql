-- Activation de la sécurité (RLS) pour les tables
ALTER TABLE public.transports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

-- Suppression des anciennes politiques si elles existent
DROP POLICY IF EXISTS "Tout le monde peut voir les transports" ON public.transports;
DROP POLICY IF EXISTS "Les admins peuvent modifier les transports" ON public.transports;
DROP POLICY IF EXISTS "Tout le monde peut voir les lieux" ON public.destinations;
DROP POLICY IF EXISTS "Les admins peuvent modifier les lieux" ON public.destinations;

-- POLITIQUES POUR 'TRANSPORTS'
CREATE POLICY "Tout le monde peut voir les transports"
ON public.transports FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Les admins peuvent tout faire sur les transports"
ON public.transports FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'ADMIN' OR profiles.role = 'SUPER_ADMIN')
  )
);

-- POLITIQUES POUR 'DESTINATIONS'
CREATE POLICY "Tout le monde peut voir les lieux"
ON public.destinations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Les admins peuvent tout faire sur les lieux"
ON public.destinations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'ADMIN' OR profiles.role = 'SUPER_ADMIN')
  )
);

-- Note: On s'assure que la table destinations existe avec les bonnes colonnes
-- CREATE TABLE IF NOT EXISTS public.destinations (
--   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
--   name text NOT NULL,
--   color text,
--   created_at timestamp with time zone DEFAULT now()
-- );

-- GRANT permissions
GRANT ALL ON public.transports TO authenticated;
GRANT ALL ON public.transports TO service_role;
GRANT ALL ON public.destinations TO authenticated;
GRANT ALL ON public.destinations TO service_role;
