# 👷 RunFlow Worker

> **Background job processor for RunFlow.**

This application handles asynchronous tasks (e.g., sending emails, processing heavy calculations) to keep the API fast and responsive.

## 🛠 Tech Stack

- **BullMQ**: Reliable Redis-based job queue.
- **Supabase**: Direct DB connection (via `@runflow/db`) for data access.

## 🚀 Getting Started

### Run locally

```bash
pnpm --filter @runflow/worker dev
```

### Adding a new job

1. Define the job type in `@runflow/schemas`.
2. Create a processor in `src/processors/`.
3. Register it in `src/index.ts`.
