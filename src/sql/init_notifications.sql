-- Création de la table notifications (Version Idempotente)
-- Ce script peut être relancé sans erreur même si la table ou les politiques existent déjà.

-- 1. Création de la table (si elle n'existe pas)
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_email text,
  target_role text,
  message text not null,
  type text default 'info',
  is_read boolean default false,
  related_transport_date text,
  meta jsonb
);

-- 2. Activation de la sécurité (RLS)
alter table public.notifications enable row level security;

-- 3. Suppression des anciennes politiques pour éviter les conflits
drop policy if exists "Lecture notifications" on public.notifications;
drop policy if exists "Creation notifications" on public.notifications;
drop policy if exists "Modification notifications" on public.notifications;
drop policy if exists "Users can view own notifications" on public.notifications;
drop policy if exists "Anyone can insert notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;

-- 4. Création des nouvelles politiques
create policy "Lecture notifications"
  on public.notifications for select
  using (true);

create policy "Creation notifications"
  on public.notifications for insert
  with check (true);

create policy "Modification notifications"
  on public.notifications for update
  using (true);
