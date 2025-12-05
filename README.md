# RunFlow Monorepo

Backend-for-frontend focused monorepo for RunFlow, providing API and worker apps with shared packages.

## Structure
- `apps/` – Fastify BFF (`api`) and BullMQ worker (`worker`).
- `packages/` – Domain logic, database access, schemas, configuration, telemetry, and integration services.
- `infra/` – Infrastructure assets such as Supabase migrations and Docker Compose definitions.

## Tooling
- **pnpm** for workspace management
- **Turborepo** for task orchestration
- **TypeScript** across all packages
- **ESLint** + **Prettier** for formatting and linting
- **Vitest** for testing

### Common commands
Run from the repository root:

- `pnpm lint` – workspace linting with a single source of truth ESLint config.
- `pnpm test` – executes unit tests (Vitest) across packages; uses `passWithNoTests` to avoid false negatives while scaffolding.
- `pnpm build` – type-checks and builds packages/apps in dependency order through Turborepo.

> Each package exposes `build`, `lint`, and `test` scripts so the orchestrator remains simple and predictable.

## Supabase & local services
- Define environment variables in `.env` (see `.env.example`).
- Supabase migrations live in `infra/supabase/migrations` and are applied via the Supabase CLI (`supabase db push --workdir infra/supabase`).
- Local dependencies are orchestrated with Docker Compose in `infra/docker` (Redis by default; optional Supabase Postgres profile for offline migration testing).

Use `pnpm` scripts at the repository root to run tasks across the workspace once Node and pnpm are available.
