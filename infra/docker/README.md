# Docker Infrastructure

Local orchestration for developer services.

## Services

- `redis` – queues and caching (exposed on `localhost:6379`).
- `supabase-db` (profile `supabase`) – optional Postgres instance mirroring Supabase defaults for applying SQL migrations locally (exposed on `localhost:54322`).

## Usage

From the repository root:

```bash
# Start Redis only
cd infra/docker && docker compose up -d redis

# Start Redis and the optional Supabase Postgres instance
cd infra/docker && docker compose --profile supabase up -d
```

Migrations can then be applied to the local Postgres instance with:

```bash
supabase db push --db-url "$DATABASE_URL" --workdir infra/supabase
```

> Tip: compose is configured without persisted volumes. If you need a clean slate during development,
> `docker compose down -v` will drop the ephemeral data directories for both Redis and Postgres.
