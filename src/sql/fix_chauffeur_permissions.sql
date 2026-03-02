-- Correction des permissions pour les chauffeurs
-- Ce script permet aux chauffeurs d'enregistrer la validation des transports et leurs horaires.

-- 1. Permettre aux chauffeurs de MODIFIER (UPDATE) les transports
-- Sans cette règle, le bouton "Valider" ne fonctionne pas de manière permanente.
DROP POLICY IF EXISTS "Chauffeurs can update transports" ON public.transports;
CREATE POLICY "Chauffeurs can update transports"
ON public.transports FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'CHAUFFEUR'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'CHAUFFEUR'
  )
);

-- 2. Permettre aux chauffeurs de LIRE tous les profils
-- Indispensable pour que l'application puisse trouver les numéros de téléphone des admins pour l'envoi des SMS de notification.
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- 3. Rappel de la règle de lecture des transports (déjà présente normalement)
DROP POLICY IF EXISTS "Tout le monde peut voir les transports" ON public.transports;
CREATE POLICY "Tout le monde peut voir les transports"
ON public.transports FOR SELECT
TO authenticated
USING (true);
