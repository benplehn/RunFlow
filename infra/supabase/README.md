# Supabase Infrastructure

This directory hosts the Supabase project scaffolding, SQL migrations, and configuration used by RunFlow.

## Layout
- `config.toml` – Supabase CLI configuration (ports, project ref, auth redirects).
- `migrations/` – versioned SQL migrations applied to both local and remote environments.
- `tests/` – pgTAP checks executed with `supabase test`.

## Getting started
1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and authenticate: `supabase login`.
2. Link the CLI to your cloud project (replace the project ref):
   ```bash
   supabase link --project-ref $SUPABASE_PROJECT_REF --workdir infra/supabase
   ```
3. Create a `.env` based on `.env.example` and populate `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
4. Apply migrations to the linked/cloud project (idempotent):
   ```bash
   pnpm db:migrate
   ```
5. For local development, start the stack:
   ```bash
   cd infra/docker
   docker compose -f docker-compose.dev.yml up -d
   ```
   Then run migrations and pgTAP tests against the local Postgres URL (defaults to `postgres://postgres:postgres@localhost:54322/postgres`):
   ```bash
   pnpm db:migrate
   supabase test db --db-url "$DATABASE_URL" --workdir infra/supabase
   ```
6. Reset a local database (drops then reapplies migrations):
   ```bash
   pnpm db:reset
   ```

> The tables are protected by RLS. Use Supabase Auth-issued JWTs when interacting with the database via the REST API or your BFF.
