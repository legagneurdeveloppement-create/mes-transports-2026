-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  email text unique,
  role text default 'USER', -- 'SUPER_ADMIN', 'ADMIN', 'CHAUFFEUR', 'USER'
  full_name text,
  direction text, -- For tracking organisation (e.g. 'Communauté de communes')
  phone text,
  approved boolean default false, -- Approval system
  
  constraint username_length check (char_length(full_name) >= 3)
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_count int;
  assigned_role text;
  is_approved boolean;
begin
  -- Vérifie si c'est le tout premier utilisateur inscrit
  select count(*) into user_count from public.profiles;

  if user_count = 0 then
    assigned_role := 'SUPER_ADMIN';
    is_approved := true;
  else
    assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'USER');
    is_approved := false; -- Default to not approved
  end if;

  insert into public.profiles (id, email, full_name, role, approved, direction)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    assigned_role,
    is_approved,
    new.raw_user_meta_data->>'direction'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
