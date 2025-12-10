-- Create user_integrations table for Strava and potentially other providers
create table public.user_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('strava')),
  access_token text not null,
  refresh_token text not null,
  expires_at bigint not null, -- Epoch timestamp from Strava
  sync_cursor bigint, -- Timestamp of last synced activity (epoch)
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Ensure one integration per provider per user
  unique(user_id, provider)
);

-- Enable RLS
alter table public.user_integrations enable row level security;

-- Policies
create policy "Users can view their own integrations"
  on public.user_integrations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own integrations"
  on public.user_integrations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own integrations"
  on public.user_integrations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own integrations"
  on public.user_integrations for delete
  using (auth.uid() = user_id);

-- Create extension if not exists
create extension if not exists moddatetime schema extensions;

-- Add trigger for updated_at
create trigger handle_updated_at before update on public.user_integrations
  for each row execute procedure extensions.moddatetime (updated_at);
