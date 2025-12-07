import { FastifyInstance } from 'fastify';
import { GeneratePlanInputSchema } from '@runflow/schemas';
import { createAuthenticatedClient } from '@runflow/db';
import { generatePlanQueue } from '../queues';
import type { ApiConfig } from '../config';

declare module 'fastify' {
  interface FastifyInstance {
    config: ApiConfig;
  }
}

export async function trainingPlanRoutes(fastify: FastifyInstance) {
  // POST /generate - Enqueue generation job
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
            startDate: { type: 'string', format: 'date' }
          }
        },
        response: {
          202: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              planId: { type: 'string', format: 'uuid' },
              status: { type: 'string' },
              message: { type: 'string' }
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

      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // 2. Setup DB Client
      const config = fastify.config;
      const supabase = createAuthenticatedClient(
        {
          supabaseUrl: config.supabase.url,
          supabaseAnonKey: config.supabase.anonKey
        },
        token
      );

      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return reply.status(401).send({ error: 'Unauthorized' });

      // 3. Create Pending Plan Record
      // We need to fetch the inserted ID to pass to the worker
      // Assuming 'user_training_plans' insert works.
      const { data: plan, error } = await supabase
        .from('user_training_plans')
        .insert({
          user_id: user.id,
          name: `Pending ${data.objective} Plan`, // Placeholder name
          start_date: data.startDate, // Ensure DB has this column or similar
          duration_weeks: data.durationWeeks, // Ensure DB has this
          status: 'pending'
          // description: ...
        })
        .select('id')
        .single();

      if (error) {
        request.log.error('Failed to create plan record in DB');
        return reply.status(500).send({
          error: 'Database Error',
          message: 'Failed to create plan record'
        });
      }

      const planId = plan.id;

      // 4. Enqueue Job
      try {
        await generatePlanQueue.add(
          'generate-plan',
          {
            userId: user.id,
            planId,
            params: data
          },
          {
            jobId: planId, // Use planId as deduplication key for the job if desired
            removeOnComplete: true,
            removeOnFail: 300 // Keep failed jobs for 5 mins
          }
        );
      } catch (err: unknown) {
        request.log.error({ msg: 'Failed to enqueue job', err });
        // Optional: rollback DB insert?
        return reply
          .status(500)
          .send({
            error: 'Queue Error',
            message: 'Failed to enqueue generation job'
          });
      }

      // 5. Return Success
      return reply.status(202).send({
        success: true,
        planId,
        status: 'pending',
        message: 'Plan generation started'
      });
    }
  );

  // GET /:id/status - Check generation status
  fastify.get(
    '/:id/status',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' }
          },
          required: ['id']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              planId: { type: 'string' },
              status: { type: 'string' }
              // optional: details about failure or success
            }
          },
          401: { type: 'object', properties: { error: { type: 'string' } } },
          404: { type: 'object', properties: { error: { type: 'string' } } }
        }
      }
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const token = request.headers.authorization?.replace('Bearer ', '');

      // Auth check (optional if public status, but safer with auth)
      if (!token) return reply.status(401).send({ error: 'Unauthorized' });

      const config = fastify.config;
      const supabase = createAuthenticatedClient(
        {
          supabaseUrl: config.supabase.url,
          supabaseAnonKey: config.supabase.anonKey
        },
        token
      );

      const { data: plan, error } = await supabase
        .from('user_training_plans')
        .select('id, status')
        .eq('id', id)
        .single();

      if (error || !plan) {
        return reply.status(404).send({ error: 'Plan not found' });
      }

      return reply.send({
        planId: plan.id,
        status: plan.status
      });
    }
  );
}
