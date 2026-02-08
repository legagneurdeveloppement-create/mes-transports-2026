-- 1. Ensure all columns exist (in case the table was old)
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists role text default 'USER';
alter table public.profiles add column if not exists direction text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists approved boolean default false;
alter table public.profiles add column if not exists email text;

-- 2. Relax constraints that might block insertion (sanity check)
alter table public.profiles drop constraint if exists username_length;

-- 3. Re-create the Trigger Function (Safe update)
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
    phone = excluded.phone; -- Update if exists
  return new;
end;
$$ language plpgsql security definer;

-- 4. FORCE BACKFILL from Auth Users
insert into public.profiles (id, email, role, full_name, direction, phone, approved)
select 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'role', 'USER'),
  COALESCE(raw_user_meta_data->>'full_name', 'Utilisateur sans nom'),
  raw_user_meta_data->>'direction',
  raw_user_meta_data->>'phone',
  true -- Auto-approve existing users for now to unblock you
from auth.users
where id not in (select id from public.profiles);

