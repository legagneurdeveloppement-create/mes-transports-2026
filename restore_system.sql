-- 1. S'assurer que la table a toutes les colonnes
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists role text default 'USER';
alter table public.profiles add column if not exists direction text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists approved boolean default false;
alter table public.profiles add column if not exists email text;
alter table public.profiles drop constraint if exists username_length;

-- 2. Réactiver la sécurité (RLS)
alter table public.profiles enable row level security;

-- 3. Recréer l'automatisme (Trigger) Corrigé
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, approved, direction, phone)
  values (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Utilisateur'),
    COALESCE(new.raw_user_meta_data->>'role', 'USER'),
    false,
    new.raw_user_meta_data->>'direction',
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    phone = excluded.phone;
  return new;
end;
$$ language plpgsql security definer;

-- DROP & RECREATE TRIGGER
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. RÉCUPÉRATION : Créer le profil pour votre compte 'test4' (et les autres)
insert into public.profiles (id, email, role, full_name, direction, phone, approved)
select 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'role', 'USER'),
  COALESCE(raw_user_meta_data->>'full_name', 'Utilisateur Récupéré'),
  raw_user_meta_data->>'direction',
  raw_user_meta_data->>'phone',
  true -- On auto-approuve pour que vous puissiez vous connecter direct
from auth.users
where id not in (select id from public.profiles);
