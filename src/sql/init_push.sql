-- Table pour stocker les abonnements Web Push
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  email text,
  role text,
  subscription jsonb not null,
  endpoint text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.push_subscriptions enable row level security;

-- Seul l'utilisateur peut gérer ses abonnements
create policy "Users can manage their own push subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id);

-- Mais le système peut les lire pour envoyer
create policy "System can read subscriptions"
  on public.push_subscriptions for select
  using (true); 

-- TRIGGER POUR ENVOYER LE PUSH
create or replace function public.notify_push_on_insert()
returns trigger as $$
begin
  perform
    net.http_post(
      url := 'https://exokpntpblfyrltcxvxk.supabase.co/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZHdsbHRicGpqZmFwdmVpY3ZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODUxMDk1MCwiZXhwIjoyMDg0MDg2OTUwfQ.s9cMxhWQ9LQS9FJFMUbizmDhIAKcbPgS6SfGuZNFY7I'
      ),
      body := jsonb_build_object('record', row_to_json(new))
    );
  return new;
end;
$$ language plpgsql security definer;

-- Suppression du trigger s'il existe
drop trigger if exists on_notification_insert on public.notifications;

-- Création du trigger
create trigger on_notification_insert
  after insert on public.notifications
  for each row execute procedure public.notify_push_on_insert();
