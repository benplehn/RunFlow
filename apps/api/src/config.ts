import { loadConfig, type Config } from '@runflow/config';

// Re-export type for usage in server.ts
export type ApiConfig = Config;

/**
 * Load configuration using the shared Zod-validated package
 */
export { loadConfig };


