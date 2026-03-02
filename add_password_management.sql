-- 1. Ajout de la colonne pour stocker/voir les mots de passe
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS managed_password TEXT;

COMMENT ON COLUMN public.profiles.managed_password IS 'Mot de passe géré par l''administrateur pour référence et modification rapide';

-- 2. Mise à jour de la fonction de trigger pour capturer le mot de passe à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, approved, direction, phone, managed_password)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Utilisateur'),
    COALESCE(new.raw_user_meta_data->>'role', 'USER'),
    false,
    new.raw_user_meta_data->>'direction',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'managed_password' -- Nouveau : capture le mot de passe
  )
  ON CONFLICT (id) DO UPDATE SET
    managed_password = EXCLUDED.managed_password,
    full_name = EXCLUDED.full_name,
    direction = EXCLUDED.direction,
    phone = EXCLUDED.phone;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
