import { Worker } from 'bullmq';
import { workerConfig, logger } from './config';
import { GENERATE_PLAN_QUEUE_NAME } from './queues/generate-plan';
import { generatePlanProcessor } from './processors/generate-plan';
import IORedis from 'ioredis';

const connection = new IORedis(workerConfig.redis.connection.url, {
  maxRetriesPerRequest: null
});

logger.info('Starting RunFlow Worker...');

const worker = new Worker(GENERATE_PLAN_QUEUE_NAME, generatePlanProcessor, {
  connection,
  concurrency: 5, // Process 5 plans in parallel
  limiter: {
    max: 10,
    duration: 1000
  }
});

worker.on('active', (job) => {
  logger.debug(`Job ${job.id} active!`);
});

worker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed!`);
});

const syncStravaWorker = new Worker(
  'sync-strava',
  async (job) => {
    // Lazy load processor to avoid circular dependencies or initialization issues
    const { syncStravaProcessor } = await import('./processors/sync-strava');
    return syncStravaProcessor(job);
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 600, // Strava rate limits (~600/15min)
      duration: 900000
    }
  }
);

syncStravaWorker.on('active', (job) =>
  logger.debug(`Sync Job ${job.id} active!`)
);
syncStravaWorker.on('completed', (job) =>
  logger.info(`Sync Job ${job.id} completed!`)
);
syncStravaWorker.on('failed', (job, err) =>
  logger.error(`Sync Job ${job?.id || 'unknown'} failed: ${err.message}`)
);

const shutdown = async () => {
  logger.info('Shutting down worker...');
  await worker.close();
  await syncStravaWorker.close();
  await connection.quit();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
