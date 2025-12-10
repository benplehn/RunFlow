# 🏃‍♂️ RunFlow Monorepo

> **Backend-for-Frontend (BFF) & Worker System for RunFlow**

![CI](https://github.com/benplehn/RunFlow/actions/workflows/ci.yml/badge.svg)

## 🌟 Overview

This is the backend repository for **RunFlow**, utilizing a **Monorepo** architecture to manage the API, background workers, and shared packages in a single codebase.

### Key Technologies

- **Runtime**: Node.js (v20+)
- **Package Manager**: [pnpm](https://pnpm.io/) + [Turborepo](https://turbo.build/)
- **API**: Fastify (TypeScript)
- **Database**: Supabase (PostgreSQL + Auth)
- **Background Jobs**: BullMQ (Redis)
- **Sessions**: Real-time GPS tracking & telemetry ingestion.

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js** (v20 or higher)
- **pnpm** (v9+)
- **Docker** (optional, for local Redis/DB if not using Cloud)

### 2. Installation

```bash
# Install dependencies for all workspaces
pnpm install
```

### 3. Environment Setup

Create a `.env` file in the root directory. You can copy the example:

```bash
cp .env.example .env
```

Ensure you have the following keys (from your Supabase Dashboard):

```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
DATABASE_URL="postgres://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres"
```

### 4. Development

Start the entire stack (API, Worker, etc.):

```bash
pnpm dev
```

- **API**: `http://localhost:4000`
- **Health Check**: `http://localhost:4000/health`

---

## 🏗️ Architecture

### Folder Structure

```
RunFlow/
├── apps/               # Runnable applications
│   ├── api/            # Main HTTP Server (Fastify)
│   └── worker/         # Background Job Runner (BullMQ)
│
├── packages/           # Shared libraries (Internal Packages)
│   ├── db/             # Database Client & Types (@runflow/db)
│   ├── domain/         # Core Business Logic (Plan Generation, Phasing) (@runflow/domain)
│   ├── schemas/        # Zod Schemas & Types (@runflow/schemas)
│   ├── config/         # Environment Configuration (@runflow/config)
│   └── services/       # Shared Services (@runflow/services)
│
└── infra/              # Infrastructure Configuration
    ├── supabase/       # SQL Migrations & Tests
    └── docker/         # Docker Compose (Redis, etc.)
```

### Testing Strategy

We enforce a strict "Pro" testing standard:

- **Unit Tests**: logic in isolation.
- **Integration Tests**: Verification against a **REAL** Supabase instance (Cloud).
- **RLS Verification**: Tests ensuring users cannot access unauthorized data.

| Command         | Description                           |
| :-------------- | :------------------------------------ |
| `pnpm test`     | Run strict unit tests                 |
| `pnpm test:api` | Run integration tests against real DB |
| `pnpm db:test`  | Run pgTAP database tests              |
| `pnpm lint`     | Enforce code quality (ESLint)         |

---

## 🔒 Security

- **Authentication**: All user routes are protected via JWT (Supabase Auth).
- **Authorization**: Row Level Security (RLS) is enforced at the database level. The API uses a **"Per-Request Authenticated Client"** pattern to forward user identity to Postgres.
