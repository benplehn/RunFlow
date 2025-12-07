# 🗄️ RunFlow Database Package

> **Shared database client configuration and types.**

This package provides a centralized way to connect to Supabase/Postgres. It is used by both the `@runflow/api` and `@runflow/worker`.

## 🧠 Key Concepts

### 1. Singleton Pattern

Database connections are expensive to create. This package uses the **Singleton Pattern** to ensure we only create _one_ connection instance per process, no matter how many times you import the client.

### 2. Row Level Security (RLS)

We use Supabase's RLS to secure data.

- **Anon Client** (`createAnonClient`): Uses the `anon` key. It respects RLS policies. This simulates what a user on the frontend would see.
- **Service Client** (`createServiceClient`): Uses the `service_role` key. It **bypasses** RLS. This is for admin tasks or background workers that need full access.

**⚠️ Security Warning:** Never expose the `service_role` key or client to the public internet/frontend!

## 📦 Usage

```typescript
import { createServiceClient } from '@runflow/db';

const db = createServiceClient({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
});

// Now you can query
const { data, error } = await db.from('profiles').select('*');
```
