import { Queue } from 'bullmq';
import { workerConfig } from '../config';
import IORedis from 'ioredis';

export const syncStravaQueueName = 'sync-strava';

const connection = new IORedis(workerConfig.redis.connection.url, {
  maxRetriesPerRequest: null
});

export const syncStravaQueue = new Queue(syncStravaQueueName, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});
