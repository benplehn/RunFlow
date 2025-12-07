import pino from 'pino';

export interface LoggerConfig {
  service: string;
  nodeEnv?: string;
  level?: string;
}

export function getLoggerOptions(config: LoggerConfig) {
  const isDev = config.nodeEnv === 'development' || config.nodeEnv === 'test';

  return {
    level: config.level || 'info',
    base: {
      service: config.service,
      env: config.nodeEnv
    },
    transport: isDev
      ? {
          target: 'pino-pretty', // Assumes pino-pretty is available in the consumer app or hoisted
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname'
          }
        }
      : undefined,
    formatters: {
      level: (label: string) => {
        return { level: label };
      }
    }
  };
}

export type Logger = pino.Logger;
