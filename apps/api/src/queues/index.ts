import { Queue } from 'bullmq';
import { loadConfig } from '@runflow/config';
import IORedis from 'ioredis';
import { GeneratePlanJobData } from '@runflow/schemas';

export const GENERATE_PLAN_QUEUE_NAME = 'generate-plan';

const config = loadConfig();

const connection = new IORedis(config.redis.url, {
  maxRetriesPerRequest: null
});

export const generatePlanQueue = new Queue<GeneratePlanJobData>(
  GENERATE_PLAN_QUEUE_NAME,
  {
    connection
  }
);

export const SYNC_STRAVA_QUEUE_NAME = 'sync-strava';

export const syncStravaQueue = new Queue(SYNC_STRAVA_QUEUE_NAME, {
  connection
});
