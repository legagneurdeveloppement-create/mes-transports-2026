-- 1. Update the function to include PHONE and handle edge cases
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, approved, direction, phone)
  values (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Utilisateur'), -- Fallback name
    COALESCE(new.raw_user_meta_data->>'role', 'USER'),
    false,
    new.raw_user_meta_data->>'direction',
    new.raw_user_meta_data->>'phone' -- Added Phone
  )
  on conflict (id) do nothing; -- Prevent crash if profile exists
  return new;
end;
$$ language plpgsql security definer;

-- 2. Ensure Trigger is active
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. REPAIR: Force-create profiles for any existing users who are missing one
-- This fixes the issue where you registered but the profile wasn't created.
insert into public.profiles (id, email, role, full_name, direction, phone, approved)
select 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'role', 'USER'),
  COALESCE(raw_user_meta_data->>'full_name', 'Utilisateur sans nom'),
  raw_user_meta_data->>'direction',
  raw_user_meta_data->>'phone',
  false
from auth.users
where id not in (select id from public.profiles);
