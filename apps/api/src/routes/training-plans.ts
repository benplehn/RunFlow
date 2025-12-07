import { FastifyInstance } from 'fastify';
import { GeneratePlanInputSchema } from '@runflow/schemas';
import { generateTrainingPlan } from '@runflow/domain';
import { createAuthenticatedClient } from '@runflow/db';
import type { ApiConfig } from '../config';

// Define augmentation for FastifyInstance to include config
declare module 'fastify' {
  interface FastifyInstance {
    config: ApiConfig;
  }
}

export async function trainingPlanRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/generate',
    {
      schema: {
        body: {
          type: 'object',
          required: [
            'objective',
            'level',
            'durationWeeks',
            'sessionsPerWeek',
            'startDate'
          ],
          properties: {
            objective: {
              type: 'string',
              enum: ['5k', '10k', 'half-marathon', 'marathon']
            },
            level: {
              type: 'string',
              enum: ['beginner', 'intermediate', 'advanced']
            },
            durationWeeks: { type: 'integer', minimum: 4, maximum: 52 },
            sessionsPerWeek: { type: 'integer', minimum: 2, maximum: 7 },
            startDate: { type: 'string', format: 'date' } // accepts ISO date string
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              description: { type: 'string' },
              status: { type: 'string' },
              durationWeeks: { type: 'integer' },
              startDate: { type: 'string' },
              weeks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    weekNumber: { type: 'integer' },
                    volumeDistance: { type: 'number' },
                    sessions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          dayOfWeek: { type: 'integer' },
                          sessionType: { type: 'string' },
                          targetDistance: { type: 'number' },
                          description: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              details: { type: 'object' }
            }
          },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      // 1. Validate Input
      const validation = GeneratePlanInputSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          error: 'Validation Error',
          details: validation.error.format()
        });
      }
      const data = validation.data;

      // 2. Generate Plan using Domain Logic
      const generatedPlan = generateTrainingPlan(data);

      // 3. Persist to DB using RPC
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // Use the config decorated on fastify instance
      const config = fastify.config;

      const supabase = createAuthenticatedClient(
        {
          supabaseUrl: config.supabase.url,
          supabaseAnonKey: config.supabase.anonKey
        },
        token
      );

      // Types are not yet generated for the new RPC, so we strictly check existence at runtime or use loose typing here
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: result, error } = await (supabase as any).rpc(
        'create_full_training_plan',
        {
          plan_data: generatedPlan
        }
      );

      if (error) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to persist training plan'
        });
      }

      const newPlanId = (result as { id: string }).id;

      // 4. Return the full plan (enriched with ID)
      return reply.status(201).send({
        ...generatedPlan,
        id: newPlanId
      });
    }
  );
}
