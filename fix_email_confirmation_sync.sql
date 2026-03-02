-- ==========================================
-- SYNC APPROBATION -> CONFIRMATION EMAIL
-- ==========================================

-- 1. Fonction pour confirmer l'email dans auth.users
CREATE OR REPLACE FUNCTION public.confirm_user_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Si l'utilisateur passe à approved = true
    IF (NEW.approved = true AND (OLD.approved = false OR OLD.approved IS NULL)) THEN
        UPDATE auth.users
        SET email_confirmed_at = NOW()
        WHERE id = NEW.id AND email_confirmed_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger sur la table profiles
DROP TRIGGER IF EXISTS tr_confirm_user_email ON public.profiles;
CREATE TRIGGER tr_confirm_user_email
    AFTER UPDATE OF approved ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.confirm_user_email();

-- 3. Correction immédiate pour les utilisateurs déjà approuvés mais non confirmés
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE id IN (SELECT id FROM public.profiles WHERE approved = true)
AND email_confirmed_at IS NULL;
