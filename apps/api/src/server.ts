import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { createAnonClient, createServiceClient } from '@runflow/db';
import { getLoggerOptions } from '@runflow/telemetry';
import { registerRoutes } from './routes';
import authPlugin from './plugins/auth';
import type { ApiConfig } from './config';

/**
 * Factory function to create the Fastify server instance.
 *
 * @param config - The validated configuration object (env vars).
 * @returns The initialized Fastify application.
 */
export async function createServer(
  config: ApiConfig
): Promise<FastifyInstance> {
  const loggerOptions = getLoggerOptions({
    service: 'api',
    nodeEnv: config.nodeEnv,
    level: config.logLevel
  });

  const fastify = Fastify({
    logger: loggerOptions
  });

  // Register CORS (Cross-Origin Resource Sharing)
  // This allows frontend apps connecting from different domains/ports to access this API.
  await fastify.register(cors, {
    origin: config.nodeEnv === 'production' ? false : true, // In prod, configure specific origins
    credentials: true
  });

  // Initialize Supabase clients
  const anonClient = createAnonClient({
    supabaseUrl: config.supabase.url,
    supabaseAnonKey: config.supabase.anonKey
  });

  const serviceClient = createServiceClient({
    supabaseUrl: config.supabase.url,
    supabaseAnonKey: config.supabase.anonKey,
    supabaseServiceRoleKey: config.supabase.serviceRoleKey
  });

  // Decorate fastify instance with db clients
  // This makes `fastify.db` available in all routes via the request object.
  // It's a form of Dependency Injection.
  fastify.decorate('db', {
    anon: anonClient,
    service: serviceClient
  });

  // Register Auth Plugin
  // This adds the `requireAuth` decorator to the fastify instance
  await fastify.register(authPlugin);

  // Register Swagger (OpenAPI)
  if (config.nodeEnv !== 'production') {
    await fastify.register(fastifySwagger, {
      swagger: {
        info: {
          title: 'RunFlow API',
          description: 'Backend API for RunFlow application',
          version: '0.1.0'
        },
        host: `localhost:${config.port}`,
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        securityDefinitions: {
          bearerAuth: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
            description: 'Supabase JWT (Bearer <token>)'
          }
        }
      }
    });

    await fastify.register(fastifySwaggerUi, {
      routePrefix: '/documentation',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false
      }
    });
  }

  // Register routes
  // We separate route definitions into different files to keep this file clean.
  await registerRoutes(fastify);

  return fastify;
}
