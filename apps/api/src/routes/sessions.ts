import { FastifyPluginAsync } from 'fastify';

import {
  CreateSessionSchema,
  UpdateSessionSchema,
  BatchPointsSchema
} from '@runflow/schemas';
import { type Json } from '@runflow/db';

export const sessionsRoutes: FastifyPluginAsync = async (fastify) => {
  // const config = loadConfig(); // Not used currently if using fastify.db.service

  // POST /me/sessions - Start a new session
  fastify.post(
    '/',
    {
      schema: {
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              status: { type: 'string' }
            }
          },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          500: { type: 'object', properties: { error: { type: 'string' } } }
        }
      }
    },
    async (request, reply) => {
      // Manual Validation
      const parseResult = CreateSessionSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply
          .status(400)
          .send({ error: 'Validation Error', details: parseResult.error });
      }
      const { plannedSessionId, startTime } = parseResult.data;

      const authHeader = request.headers.authorization;
      if (!authHeader) return reply.status(401).send({ error: 'Unauthorized' });

      const token = authHeader.replace(/^Bearer\s+/i, '');

      const client = fastify.db.service;

      const {
        data: { user: authUser },
        error: authError
      } = await client.auth.getUser(token);
      if (authError || !authUser)
        return reply.status(401).send({ error: 'Unauthorized' });

      const { data, error } = await client
        .from('sessions')
        .insert({
          user_id: authUser.id,
          planned_session_id: plannedSessionId,
          start_time: startTime,
          status: 'in_progress'
        })
        .select('id, status')
        .single();

      if (error) {
        console.error('FULL DB ERROR:', error);
        request.log.error(
          { err: JSON.stringify(error, null, 2) },
          'Failed to create session'
        );
        return reply.status(500).send({ error: 'Database Error' });
      }

      return reply.status(201).send(data);
    }
  );

  // PATCH /me/sessions/:id - Update session
  fastify.patch(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              status: { type: 'string' },
              start_time: { type: 'string' },
              end_time: { type: 'string', nullable: true },
              metrics: {
                type: 'object',
                nullable: true,
                additionalProperties: true
              }
            }
          },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
          500: { type: 'object', properties: { error: { type: 'string' } } }
        }
      }
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const parseResult = UpdateSessionSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply
          .status(400)
          .send({ error: 'Validation Error', details: parseResult.error });
      }
      const updates = parseResult.data;

      const authHeader = request.headers.authorization;
      if (!authHeader) return reply.status(401).send();
      const token = authHeader.replace(/^Bearer\s+/i, '');

      const client = fastify.db.service;
      const {
        data: { user: authUser }
      } = await client.auth.getUser(token);
      if (!authUser) return reply.status(401).send();

      // Ensure ownership (Service Role bypasses RLS, so check here OR use restricted client)
      const { data, error } = await client
        .from('sessions')
        .update({
          status: updates.status,
          end_time: updates.endTime,
          metrics: updates.metrics,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', authUser.id) // Manual RLS enforcement
        .select('*')
        .single();

      if (error) return reply.status(500).send({ error: error.message });
      // .single() returns error if no rows found usually, but explicit check:
      if (!data) return reply.status(404).send({ error: 'Session not found' });

      return reply.send(data);
    }
  );

  // POST /me/sessions/:id/points - Ingest Points
  fastify.post(
    '/:id/points',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id']
        },
        response: {
          200: {
            type: 'object',
            properties: { count: { type: 'number' } }
          },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } },
          500: { type: 'object', properties: { error: { type: 'string' } } }
        }
      }
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const parseResult = BatchPointsSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply
          .status(400)
          .send({ error: 'Validation Error', details: parseResult.error });
      }
      const { points } = parseResult.data;

      const authHeader = request.headers.authorization;
      if (!authHeader) return reply.status(401).send();
      const token = authHeader.replace(/^Bearer\s+/i, '');

      const client = fastify.db.service;
      const {
        data: { user: authUser },
        error: authError
      } = await client.auth.getUser(token);
      if (authError || !authUser)
        return reply.status(401).send({ error: 'Unauthorized' });

      // Check ownership first?
      const { data: session } = await client
        .from('sessions')
        .select('id')
        .eq('id', id)
        .eq('user_id', authUser.id)
        .single();

      if (!session)
        return reply.status(404).send({ error: 'Session not found' });

      // Transform points for DB
      const dbPoints = points.map((p) => ({
        session_id: id,
        timestamp: p.timestamp,
        lat: p.lat,
        lon: p.lon,
        alt: p.alt,
        heart_rate: p.heartRate,
        data: p.data as Json
      }));

      // Bulk Insert
      const { error } = await client
        .from('session_points')
        .insert(dbPoints)
        .select('id');

      if (error) return reply.status(500).send({ error: error.message });

      return reply.send({ count: points.length });
    }
  );
};
