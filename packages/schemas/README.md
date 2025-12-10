# 🛡️ RunFlow Schemas

> **Shared Zod schemas for validation and type safety.**

This package ensures that both the API and Worker (and any future frontend) speak the same language.

## 📦 Included Schemas

### 1. Training Plans (`training.ts`)

- `GeneratePlanSchema`: Input validation for creating plans.
- `TrainingPlanStatusSchema`: Enum for plan states.

### 2. Sessions (`sessions.ts`)

- `CreateSessionSchema`: Validation for starting a new run.
- `UpdateSessionSchema`: Validation for updating status/metrics.
- `BatchPointsSchema`: Validation for high-frequency GPS point ingestion.
- `SessionPointSchema`: Detailed structure of a single telemetry point.

## 🚀 Usage

```typescript
import { CreateSessionSchema } from '@runflow/schemas';

const result = CreateSessionSchema.safeParse(inputData);
if (!result.success) {
  // Handle validation error
}
```
