-- Promotion du compte au rang de SUPER_ADMIN (Majuscules obligatoires)
UPDATE public.profiles 
SET role = 'SUPER_ADMIN', approved = true 
WHERE email = 'ec-el-manlay-21@ac-dijon.fr';

-- Promotion aussi pour le compte de test si besoin
UPDATE public.profiles 
SET role = 'SUPER_ADMIN', approved = true 
WHERE email = 'test4@demo.fr';
