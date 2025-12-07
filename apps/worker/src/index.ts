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

worker.on('failed', (job, err) => {
  if (job) {
    logger.error(`Job ${job.id} failed with ${err.message}`);
  } else {
    logger.error(`Job failed (no job data) with ${err.message}`);
  }
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down worker...');
  await worker.close();
  await connection.quit();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
