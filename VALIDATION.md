# Validation Guide

This document outlines the steps to validate the project's health, from infrastructure to user facing features.

> [!IMPORTANT]
> **Cloud First**: We develop and validte directly against **Supabase Cloud**.
> Ensure your `.env` contains valid credentials: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## 🎯 Step 1: Foundation & Tooling

**Goal**: Ensure the monorepo builds and lints without errors.

```bash
# 1. Install dependencies
pnpm install

# 2. Check code quality
pnpm lint

# 3. Build all packages
pnpm build
```

✅ **Success Criteria**: All commands exit with `0` code (no errors).

---

## 🎯 Step 2: Database Infrastructure

**Goal**: Apply schema to the cloud and verify with pgTAP tests.

```bash
# 1. Push migrations to Supabase Cloud
pnpm db:migrate

# 2. Run Database Logic Tests (pgTAP)
pnpm db:test
```

✅ **Success Criteria**:

- Migrations apply successfully.
- pgTAP tests pass (validating RLS policies and table structures).

---

## 🎯 Step 3: API Health

**Goal**: Ensure the API server starts and connects to the DB.

```bash
# 1. Start the API
pnpm dev:api

# 2. Check Health (in another terminal)
curl http://localhost:4000/health
# -> {"status":"ok"}

curl http://localhost:4000/health/db
# -> {"database":{"connected":true}}
```

---

## 🎯 Step 4: Authentication & Security

**Goal**: Verify that users can login and that unauthenticated requests are blocked.

### Manual Verification

1. **Unauthenticated Request**
   ```bash
   curl -i http://localhost:4000/me
   ```
   -> **401 Unauthorized**

### Automated Verification

```bash
pnpm --filter @runflow/api test src/__tests__/auth.test.ts
```

---

## 🎯 Step 5: Features (Profile & Training Plans)

**Goal**: Verify "Pro" features including RLS isolation and cascade deletions.

### Automated Integration Tests

This is the gold standard for validation. It runs `create` -> `read` -> `delete` flows against the **Real Cloud DB**.

```bash
# Run all integration tests (Profile + Training Plans)
pnpm test:api
```

✅ **Success Criteria**:

- **Profile**: Can update and retrieve own profile.
- **Training Plans**:
  - User A cannot see User B's plans (Data Isolation).
  - Deleting a plan deletes all its weeks/sessions (Cascade).
  - Invalid inputs return `400 Bad Request`.

---

## 🚀 Final Check

To be ready for delivery/next steps, run the full CI suite locally:

```bash
# Simulates what happens on GitHub Actions
pnpm lint && pnpm build && pnpm test
```
