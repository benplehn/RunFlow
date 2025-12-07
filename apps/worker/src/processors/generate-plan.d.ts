import { Job } from 'bullmq';
import { GeneratePlanJobResult } from '../queues/generate-plan';
import { GeneratePlanJobData } from '@runflow/schemas';
/**
 * Processor for the 'generate-plan' job.
 *
 * 1. Generates the plan using the domain logic.
 * 2. Persists the plan to the database.
 * 3. Updates the status to 'generated'.
 */
export declare function generatePlanProcessor(
  job: Job<GeneratePlanJobData, GeneratePlanJobResult>
): Promise<GeneratePlanJobResult>;
//# sourceMappingURL=generate-plan.d.ts.map
