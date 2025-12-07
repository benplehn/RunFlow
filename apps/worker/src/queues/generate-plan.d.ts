import { Queue } from 'bullmq';
import { GeneratePlanJobData } from '@runflow/schemas';
export declare const GENERATE_PLAN_QUEUE_NAME = 'generate-plan';
export interface GeneratePlanJobResult {
  success: boolean;
  planId: string;
}
export declare const generatePlanQueue: Queue<
  GeneratePlanJobData,
  GeneratePlanJobResult,
  string,
  GeneratePlanJobData,
  GeneratePlanJobResult,
  string
>;
//# sourceMappingURL=generate-plan.d.ts.map
