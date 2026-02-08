-- 1. Create table ONLY if it doesn't exist
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  email text unique,
  role text default 'USER',
  full_name text,
  direction text,
  phone text,
  approved boolean default false,
  
  constraint username_length check (char_length(full_name) >= 3)
);

-- 2. Force enable RLS
alter table profiles enable row level security;

-- 3. Put policies in a do block to drop them first (safety)
do $$ 
begin
    drop policy if exists "Public profiles are viewable by everyone." on profiles;
    drop policy if exists "Users can insert their own profile." on profiles;
    drop policy if exists "Users can update own profile." on profiles;
end $$;

-- 4. Create Policies
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- 5. Function (Create or Replace is already safe)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, approved, direction)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'USER'),
    false, -- Default to not approved
    new.raw_user_meta_data->>'direction'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 6. Trigger (Drop first to be safe)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
