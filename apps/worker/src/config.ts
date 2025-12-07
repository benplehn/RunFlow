import { loadConfig } from '@runflow/config';
import { getLoggerOptions } from '@runflow/telemetry';
import pino from 'pino';

// Load shared config (validates env vars)
const config = loadConfig();

export const workerConfig = {
  redis: {
    connection: {
      url: config.redis.url,
      // Common Redis options
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false
    }
  },
  logging: {
    level: config.logLevel
  }
};

export const logger = pino(
  getLoggerOptions({
    service: 'worker',
    level: config.logLevel,
    nodeEnv: config.nodeEnv
  })
);

export { config };
