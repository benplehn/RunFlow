import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { HealthResponse, DbHealthResponse } from '../types';

/**
 * Health check routes.
 * These are used by monitoring tools (like AWS, Kubernetes) to ensure the app is alive.
 */
export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /health - Basic health check
  // The generic <{ Reply: HealthResponse }> ensures our return type matches the interface.
  fastify.get<{ Reply: HealthResponse }>('/health', async (
    _request: FastifyRequest,
    reply: FastifyReply
  ) => {
    return reply.code(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  // GET /health/db - Database health check
  fastify.get<{ Reply: DbHealthResponse }>('/health/db', async (
    _request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      // Simple SELECT 1 equivalent - query any table
      const { error } = await fastify.db.service
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) {
        fastify.log.error({ error }, 'Database health check failed');
        return reply.code(503).send({
          status: 'error',
          timestamp: new Date().toISOString(),
          details: 'Database connection failed',
          database: {
            connected: false,
          },
        });
      }

      return reply.code(200).send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
        },
      });
    } catch (err) {
      fastify.log.error({ err }, 'Database health check threw exception');
      return reply.code(503).send({
        status: 'error',
        timestamp: new Date().toISOString(),
        details: 'Database query failed',
        database: {
          connected: false,
        },
      });
    }
  });
}
