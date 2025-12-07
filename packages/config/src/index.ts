import { z } from 'zod';
import dotenv from 'dotenv';
import { join } from 'path';

// Load .env.local from monorepo root
// Load .env.cloud first
const cloudPath = join(__dirname, '../../../.env.cloud');
console.log('Trying to load cloud config from:', cloudPath);
const cloudResult = dotenv.config({ path: cloudPath });

if (cloudResult.error) {
  console.log('Error loading .env.cloud:', cloudResult.error);
} else {
  console.log('Loaded .env.cloud. SUPABASE_URL:', process.env.SUPABASE_URL);
}

// Then local
const localPath = join(__dirname, '../../../.env.local');
console.log('Trying to load local config from:', localPath);
dotenv.config({ path: localPath });
console.log('After .env.local load. SUPABASE_URL:', process.env.SUPABASE_URL);

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
      .min(1, { message: 'SUPABASE_SERVICE_ROLE_KEY is required' })
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
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
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
