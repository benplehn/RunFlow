import { Queue } from 'bullmq';
import { workerConfig } from '../config';
import IORedis from 'ioredis';
import { GeneratePlanJobData } from '@runflow/schemas';

export const GENERATE_PLAN_QUEUE_NAME = 'generate-plan';

export interface GeneratePlanJobResult {
  success: boolean;
  planId: string;
}

// Reuse Redis connection for Queue if possible, or create new
const connection = new IORedis(workerConfig.redis.connection.url, {
  maxRetriesPerRequest: null
});

export const generatePlanQueue = new Queue<
  GeneratePlanJobData,
  GeneratePlanJobResult
>(GENERATE_PLAN_QUEUE_NAME, {
  connection
});
