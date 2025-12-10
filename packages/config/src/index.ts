import { z } from 'zod';
import dotenv from 'dotenv';
import { join } from 'path';

// Load .env from monorepo root for local development
if (!process.env.CI) {
  const envPath = join(__dirname, '../../../.env');
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    // Silent fail safely - maybe file doesn't exist, which is fine if env vars are set otherwise
    // But for debugging locally it's good to know.
    // console.debug('No .env file found at root');
  } else {
    // console.debug('Loaded local .env file');
  }
}

/**
 * Validated schema for environment variables using Zod.
 * Allows safe parsing and typing of process.env.
 */
export const configSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().default(4000),
  logLevel: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  supabase: z.object({
    url: z.string().url({ message: 'SUPABASE_URL must be a valid URL' }),
    anonKey: z.string().min(1, { message: 'SUPABASE_ANON_KEY is required' }),
    serviceRoleKey: z
      .string()
      .min(1, { message: 'SUPABASE_SERVICE_ROLE_KEY is required' }),
    jwtSecret: z.string().min(1, { message: 'SUPABASE_JWT_SECRET is required' })
  }),
  redis: z.object({
    url: z.string().url().default('redis://localhost:6379')
  }),
  strava: z.object({
    clientId: z.string().optional(),
    clientSecret: z.string().optional()
  })
});

export type Config = z.infer<typeof configSchema>;

/**
 * Loads and validates configuration from environment variables.
 * @throws {Error} If validation fails (missing or invalid vars).
 * @returns {Config} Validated configuration object.
 */
export function loadConfig(): Config {
  const result = configSchema.safeParse({
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    logLevel: process.env.LOG_LEVEL,
    supabase: {
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      jwtSecret: process.env.SUPABASE_JWT_SECRET
    },
    redis: {
      url: process.env.REDIS_URL
    },
    strava: {
      clientId: process.env.STRAVA_CLIENT_ID,
      clientSecret: process.env.STRAVA_CLIENT_SECRET
    }
  });

  if (!result.success) {
    const errorMessages = result.error.issues
      .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
      .join('\n');
    throw new Error(`Invalid configuration:\n${errorMessages}`);
  }

  return result.data;
}
