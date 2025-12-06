# ⚡️ RunFlow API Service

> **The HTTP entry point for the RunFlow platform.**

This application is built with **Fastify**, a high-performance framework for Node.js. It serves as the "Backend-for-Frontend" (BFF).

## 📂 Structure

```
src/
├── __tests__/      # Integration tests
├── plugins/        # Fastify plugins (cors, auth, etc.)
├── routes/         # API endpoints (the URL paths)
├── config.ts       # Environment variable loading
├── server.ts       # Server factory (creates the app)
└── index.ts        # Entry point (starts the app)
```

## 🛠 Features

- **Fastify**: Core framework.
- **Supabase**: Database connection via `@runflow/db`.
- **Zod**: Schema validation (coming soon).
- **Pino**: High-performance logging.

## 👩‍💻 Developer Guide

### How to add a new route?

1. Create a new file in `src/routes/`, for example `src/routes/users.ts`.
2. Define a Fastify plugin function:

```typescript
import type { FastifyInstance } from 'fastify';

export async function userRoutes(fastify: FastifyInstance) {
  
  // GET /users/me
  fastify.get('/users/me', async (request, reply) => {
    return { id: 'current-user-id', name: 'Ben' };
  });

}
```

3. Register the route in `src/server.ts`:

```typescript
import { userRoutes } from './routes/users';

// ... inside registerRoutes function
await app.register(userRoutes);
```

### Running Locally

To run *only* this app (ignoring the worker):

```bash
pnpm --filter @runflow/api dev
```

The server will start on `http://localhost:4000`.
