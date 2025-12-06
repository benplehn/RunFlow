import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { createAnonClient, createServiceClient } from '@runflow/db';
import { registerRoutes } from './routes';
import type { ApiConfig } from './config';

/**
 * Factory function to create the Fastify server instance.
 * 
 * @param config - The validated configuration object (env vars).
 * @returns The initialized Fastify application.
 */
export async function createServer(config: ApiConfig): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: config.logging.level,
      ...(config.logging.pretty && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      }),
    },
  });

  // Register CORS (Cross-Origin Resource Sharing)
  // This allows frontend apps connecting from different domains/ports to access this API.
  await fastify.register(cors, {
    origin: config.nodeEnv === 'production' ? false : true, // In prod, configure specific origins
    credentials: true,
  });

  // Initialize Supabase clients
  const anonClient = createAnonClient({
    supabaseUrl: config.supabase.url,
    supabaseAnonKey: config.supabase.anonKey,
  });

  const serviceClient = createServiceClient({
    supabaseUrl: config.supabase.url,
    supabaseAnonKey: config.supabase.anonKey,
    supabaseServiceRoleKey: config.supabase.serviceRoleKey,
  });

  // Decorate fastify instance with db clients
  // This makes `fastify.db` available in all routes via the request object.
  // It's a form of Dependency Injection.
  fastify.decorate('db', {
    anon: anonClient,
    service: serviceClient,
  });

  // Register routes
  // We separate route definitions into different files to keep this file clean.
  await registerRoutes(fastify);

  return fastify;
}
