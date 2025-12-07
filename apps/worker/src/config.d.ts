import pino from 'pino';
declare const config: {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
    jwtSecret: string;
  };
  redis: {
    url: string;
  };
};
export declare const workerConfig: {
  redis: {
    connection: {
      url: string;
      maxRetriesPerRequest: null;
      enableReadyCheck: boolean;
    };
  };
  logging: {
    level: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  };
};
export declare const logger: pino.Logger<never, boolean>;
export { config };
//# sourceMappingURL=config.d.ts.map
