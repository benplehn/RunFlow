# Supabase Infrastructure

This directory hosts the Supabase project scaffolding, SQL migrations, and configuration used by RunFlow.

## Layout
- `config.toml` – Supabase CLI configuration (ports, project ref, auth redirects).
- `migrations/` – versioned SQL migrations applied to both local and remote environments.

## Getting started
1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and authenticate: `supabase login`.
2. Link the CLI to your cloud project (replace the project ref):
   ```bash
   supabase link --project-ref $SUPABASE_PROJECT_REF --workdir infra/supabase
   ```
3. Apply migrations to your cloud project:
   ```bash
   supabase db push --workdir infra/supabase
   ```
4. For local development, start a Postgres instance (see `infra/docker/docker-compose.yml` with the `supabase` profile) and push migrations to it:
   ```bash
   supabase db push --db-url "$DATABASE_URL" --workdir infra/supabase
   ```

> The tables are protected by RLS. Use Supabase Auth-issued JWTs when interacting with the database via the REST API or your BFF.
