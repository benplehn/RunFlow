-- Base extensions and helpers for RunFlow
-- Keep this file free of business logic so it can be reused across environments.

-- UUID generation and crypto helpers
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Testing utilities
create extension if not exists pgtap;

-- Timestamp trigger helper used by downstream tables
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;
