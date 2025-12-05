# RunFlow Monorepo

[![CI](https://github.com/YOUR_USERNAME/RunFlow/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/RunFlow/actions/workflows/ci.yml)

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

- `pnpm dev` – starts development servers for all apps
- `pnpm build` – type-checks and builds packages/apps in dependency order through Turborepo
- `pnpm lint` – workspace linting with a single source of truth ESLint config
- `pnpm format` – format code with Prettier

#### Testing

- `pnpm test` or `pnpm test:unit` – runs unit tests (Vitest) across all packages
- `pnpm test:db` – runs database tests (pgTAP) against local Postgres
- `pnpm test:all` – runs both unit and database tests (recommended before commits)
- `pnpm test:watch` – runs unit tests in watch mode for rapid development
- `pnpm test:coverage` – generates coverage reports

#### Database Management

- `pnpm db:migrate` – applies migrations to the database specified by `DATABASE_URL`
- `pnpm db:reset` – resets database and reapplies all migrations (local only)
- `pnpm db:test` – runs pgTAP database tests

> Each package exposes `build`, `lint`, and `test` scripts so the orchestrator remains simple and predictable.

## Supabase & local services

- Define environment variables in `.env` (see `.env.example`).
- Supabase migrations live in `infra/supabase/migrations` and are applied via the Supabase CLI (`supabase db push --workdir infra/supabase`).
- Local dependencies are orchestrated with Docker Compose in `infra/docker` (Redis by default; optional Supabase Postgres profile for offline migration testing).

Use `pnpm` scripts at the repository root to run tasks across the workspace once Node and pnpm are available.

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration. The CI pipeline validates both foundational steps:

### Étape 1 - Socle Monorepo & Outillage ✅

The CI verifies that the backend can:

- ✅ **Compile and test reproducibly**
  - Install all dependencies: `pnpm install`
  - Build API + worker + packages: `pnpm build`
  - Run unit tests: `pnpm test`
- ✅ **Follow target architecture**
  - Physical separation: `apps/api`, `apps/worker`, `packages/*`
  - Correct inter-package imports via TypeScript paths
- ✅ **Ensure minimum quality standards**
  - Static analysis: `pnpm lint`
  - Consistent code formatting: `pnpm format`

### Étape 2 - Supabase & Infrastructure ✅

The CI verifies that the backend can:

- ✅ **Provision Supabase from scratch**
  - Create empty but compliant database: `pnpm db:migrate`
  - Recreate clean local environment: `pnpm db:reset`
- ✅ **Manage environments**
  - Distinguish local dev vs cloud Supabase
  - Load correct configuration via `packages/config` (validated with Zod)
- ✅ **Connect to Supabase in typed, centralized way**
  - Expose Supabase client factories in `packages/db`
  - Anon client (future user-space usage)
  - Service role client (API/worker, not exposed to client)
- ✅ **Verify database state**
  - Execute pgTAP tests demonstrating:
    - Database responds
    - Required extensions (uuid, pgcrypto, pgtap) are present
    - Schema structure is valid (tables, indexes, constraints)
    - RLS policies are enabled and defined
    - Custom functions exist and work

### Running CI Locally

You can run the same checks locally before pushing:

```bash
# Full CI pipeline
make ci

# Or step by step:
pnpm install
pnpm lint
pnpm build
pnpm test:unit
pnpm db:test
```

### CI Workflow

The GitHub Actions workflow ([.github/workflows/ci.yml](.github/workflows/ci.yml)) includes:

1. **Install & Cache** - Install dependencies with caching
2. **Lint** - ESLint + Prettier format check
3. **Build** - Compile all packages and apps
4. **Unit Tests** - Run Vitest tests with coverage
5. **Database Tests** - Run pgTAP tests against PostgreSQL service
6. **Validation** - Verify Steps 1 & 2 completion criteria
7. **Summary** - Display CI results

All checks must pass for the pipeline to succeed.
