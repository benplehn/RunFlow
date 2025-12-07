import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { createTrainingPlan, createAuthenticatedClient } from '@runflow/db';
import { loadConfig } from '../config';

const CreatePlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  start_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format'
  }),
  duration_weeks: z.number().int().positive()
});

export async function trainingPlanRoutes(fastify: FastifyInstance) {
  // Helper to get auth client
  const getClient = (request: FastifyRequest) => {
    const token = request.headers.authorization?.split(' ')[1] || '';
    const config = loadConfig();
    return createAuthenticatedClient(
      {
        supabaseUrl: config.supabase.url,
        supabaseAnonKey: config.supabase.anonKey
      },
      token
    );
  };

  // Create a new training plan
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'start_date', 'duration_weeks'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          start_date: { type: 'string', format: 'date' },
          duration_weeks: { type: 'integer', minimum: 1 }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            status: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: [fastify.requireAuth],
    handler: async (request, reply) => {
      const { user } = request;
      if (!user) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const body = CreatePlanSchema.parse(request.body);
      const client = getClient(request);

      try {
        // Use authenticated client - RLS will enforce policies
        const plan = await createTrainingPlan(client, {
          user_id: user.id,
          name: body.name,
          description: body.description ?? null,
          start_date: body.start_date,
          duration_weeks: body.duration_weeks,
          status: 'active'
        });

        request.log.info({ planId: plan?.id }, 'Training plan created');
        return reply.status(201).send(plan);
      } catch (err) {
        request.log.error({ err }, 'Failed to create training plan');
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to create training plan'
        });
      }
    }
  });

  // List user's training plans
  fastify.get('/', {
    schema: {
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              status: { type: 'string' },
              start_date: { type: 'string' },
              duration_weeks: { type: 'integer' }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: [fastify.requireAuth],
    handler: async (request, reply) => {
      const { user } = request;
      if (!user) return reply.status(401);

      const client = getClient(request);
      // RLS automatically filters rows for the user
      const { data, error } = await client
        .from('user_training_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        request.log.error({ err: error }, 'Failed to list plans');
        return reply.status(500).send({ message: 'Database error' });
      }

      return data;
    }
  });

  // Get single plan
  fastify.get('/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            start_date: { type: 'string' },
            duration_weeks: { type: 'number' },
            status: { type: 'string' }
          },
          additionalProperties: true
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: [fastify.requireAuth],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const { user } = request;
      if (!user) return reply.status(401);

      const client = getClient(request);
      // RLS ensures they can only see their own plan
      const { data, error } = await client
        .from('user_training_plans')
        .select(
          `
                *,
                planned_weeks (
                    *,
                    planned_sessions (*)
                )
            `
        )
        .eq('id', id)
        .single();

      if (error) {
        // Supabase returns error if row not found (or filtered by RLS)
        return reply.status(404).send({ message: 'Plan not found' });
      }

      return data;
    }
  });

  // Delete training plan
  fastify.delete('/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        204: {
          type: 'null'
        },
        401: {
          type: 'object',
          properties: { message: { type: 'string' } }
        },
        404: {
          type: 'object',
          properties: { message: { type: 'string' } }
        },
        500: {
          type: 'object',
          properties: { message: { type: 'string' } }
        }
      }
    },
    preHandler: [fastify.requireAuth],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const { user } = request;
      if (!user) return reply.status(401);

      const client = getClient(request);
      // RLS ensures they can only delete their own plan
      const { error, count } = await client
        .from('user_training_plans')
        .delete({ count: 'exact' })
        .eq('id', id);

      if (error) {
        request.log.error({ err: error }, 'Failed to delete plan');
        return reply.status(500).send({ message: 'Internal Server Error' });
      }

      // Note: delete on RLS filtered row might return success with count 0 if not found
      if (count === 0) {
        return reply
          .status(404)
          .send({ message: 'Plan not found or not owned by user' });
      }

      return reply.status(204).send();
    }
  });
}
