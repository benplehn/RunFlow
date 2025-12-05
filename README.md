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

Use `pnpm` scripts at the repository root to run tasks across the workspace once Node and pnpm are available.
