# 🏃‍♂️ RunFlow Monorepo

> **Backend-for-Frontend (BFF) & Worker System for RunFlow**

![CI](https://github.com/benplehn/RunFlow/actions/workflows/ci.yml/badge.svg)

## 🌟 What is this?

This is the backend repository for RunFlow. It is a **monorepo**, meaning multiple related projects live together in one place.

It includes:

- **API**: A Fastify server that handles requests from the frontend app.
- **Worker**: A background job processor (using BullMQ) for heavy tasks.
- **Packages**: Shared code (database clients, types, configs) used by both the API and Worker.
- **Infrastructure**: Supabase (Postgres) and Docker definitions.

---

## 🚀 Quick Start Guide

**Prerequisites:**

- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) (v9+)

### 1. Setup the project

```bash
# Install all dependencies for all apps and packages
pnpm install
```

### 2. Configure Environment

Ensure you have a `.env` file with your Supabase Cloud credentials (see `.env.example`):

```bash
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
```

### 3. Run the development server

```bash
# Starts the API, Worker, and watches for changes
pnpm dev
```

That's it!

- The **API** will be running at `http://localhost:4000`.
- The **Supabase Dashboard** (local) will be at `http://localhost:54323`.

---

## 🏛️ How it works

This project uses **Turborepo** to manage tasks. Instead of running commands in each folder, you run them from the root, and Turbo handles the rest.

### Folder Structure

```
RunFlow/
├── apps/               # Runnable applications
│   ├── api/            # HTTP Server (Fastify)
│   └── worker/         # Background Job Runner (BullMQ)
│
├── packages/           # Shared libraries
│   ├── db/             # Database client (Supabase)
│   ├── domain/         # Business logic & calculations
│   ├── schemas/        # Types & Validation (Zod)
│   └── config/         # Environment variables
│
└── infra/              # Infrastructure
    ├── supabase/       # Database migrations & config
    └── docker/         # Docker Compose files
```

### Common Commands

| Command           | Description                                   |
| :---------------- | :-------------------------------------------- |
| `pnpm dev`        | Start everything in development mode          |
| `pnpm build`      | Compile all TypeScript code                   |
| `pnpm test`       | Run unit tests                                |
| `pnpm test:db`    | Run database tests (pgTAP)                    |
| `pnpm db:migrate` | Update your local database schema             |
| `pnpm db:reset`   | **Wipe** local DB and re-apply all migrations |

---

## 🧠 Key Concepts for Beginners

### 1. The Monorepo (Workspaces)

We use `pnpm workspaces`. Code in `packages/` can be imported by `apps/`.
_Example:_ The `api` app imports the database client from `@runflow/db` (which lives in `packages/db`).

### 2. The Database (Supabase)

We use Supabase (which is PostgreSQL + tools).

- **Migrations**: SQL files in `infra/supabase/migrations` define the database structure.
- **Types**: We generate TypeScript types from the DB schema automatically (not set up yet, but coming soon).

### 3. The API (Fastify)

Fastify is a fast, low-overhead web framework for Node.js. It's similar to Express but faster and with better TypeScript support.

---

## ✅ CI/CD Pipeline

We use GitHub Actions to test code automatically.

1. **Lint & Build**: Checks code style and compilation.
2. **Unit Tests**: Runs logic tests in isolation.
3. **Database Tests**: Spins up a real Postgres DB to test storage logic.
4. **API Tests**: Runs the server and makes real HTTP requests to verify health.
