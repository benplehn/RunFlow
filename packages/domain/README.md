# 🧠 RunFlow Domain Logic

This package contains the **Pure Business Logic** for the RunFlow application. It is completely decoupled from the database, API, or any external framework.

## 🎯 Design Principles

- **Purity**: Functions should be deterministic and side-effect free where possible.
- **Portability**: This code can run in the API, a Worker, or even the Browser.
- **Testing**: Heavy unit testing coverage ensures core rules are solid.

## 🏃‍♂️ Training Plan Generation

The core feature of this domain is the **Training Plan Generator**, inspired by _Training for the Uphill Athlete_.

### Logic Flow

1.  **Phase Splitting**: The `durationWeeks` is split into:
    - **Base (40%)**: Volume accumulation.
    - **Build (30%)**: Intensity introduction.
    - **Peak (20%)**: Race specificity.
    - **Taper (10%)**: Recovery before race.

2.  **Week Generation**:
    - Calculates weekly volume targets based on `level` ('beginner', 'intermediate', ...).
    - Applies a ~10% progression rule.
    - Inserts "Recovery Weeks" every 4th week (Deload).

3.  **Session Distribution**:
    - **Long Run**: ~35% of weekly volume (Sunday).
    - **Easy Runs**: Distributed across remaining days.
    - **Quality**: Intervals added during Build/Peak phases.

### Usage

```typescript
import { generateTrainingPlan } from '@runflow/domain/src/training-plan';

const plan = generateTrainingPlan({
  objective: 'marathon',
  level: 'intermediate',
  durationWeeks: 16,
  sessionsPerWeek: 5,
  startDate: '2025-01-01'
});

console.log(plan.weeks); // Full structure ready for DB
```
