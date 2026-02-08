-- 1. DISABLE RLS TEMPORARILY (To ensure you see the data)
alter table public.profiles disable row level security;

-- 2. FORCE INSERT (BACKFILL)
-- We use a simple insert to recover any user stuck in auth.users
insert into public.profiles (id, email, role, full_name, direction, phone, approved)
select 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'role', 'USER'),
  COALESCE(raw_user_meta_data->>'full_name', 'Utilisateur Récupéré'),
  raw_user_meta_data->>'direction',
  raw_user_meta_data->>'phone',
  true -- Auto-approve to unblock you immediately
from auth.users
where id not in (select id from public.profiles);

-- 3. VERIFICATION (Look at the "Results" tab after running this)
select * from public.profiles;
