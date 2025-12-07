import { FastifyInstance } from 'fastify';
import { UpdateProfileSchema, ProfileSchema } from '@runflow/schemas';
import { z } from 'zod';

export async function profileRoutes(fastify: FastifyInstance) {
    fastify.get('/me/profile', {
        preHandler: [fastify.requireAuth],
        schema: {
            description: 'Get current user profile',
            tags: ['profile'],
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    description: 'User profile',
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        display_name: { type: 'string', nullable: true },
                        avatar_url: { type: 'string', nullable: true },
                        country: { type: 'string', nullable: true },
                        created_at: { type: 'string' },
                        updated_at: { type: 'string' },
                    },
                },
                400: { type: 'object', properties: { message: { type: 'string' } } },
                401: { type: 'object', properties: { message: { type: 'string' } } },
                404: {
                    description: 'Profile not found',
                    type: 'object',
                    properties: {
                        message: { type: 'string' }
                    }
                },
                500: {
                    description: 'Internal Server Error',
                    type: 'object',
                    properties: {
                        message: { type: 'string' }
                    }
                }
            },
        },
    }, async (request, reply) => {
        const user = request.user!;

        const { data, error } = await request.server.db.service
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Profile fetch error:', error);
            request.log.error({ err: error }, 'Failed to fetch profile');
            return reply.code(500).send({ message: 'Internal Server Error' });
        }

        if (!data) {
            return reply.code(404).send({ message: 'Profile not found' });
        }

        return data;
    });

    fastify.put('/me/profile', {
        preHandler: [fastify.requireAuth],
        schema: {
            description: 'Update current user profile',
            tags: ['profile'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                properties: {
                    display_name: { type: 'string' },
                    avatar_url: { type: 'string' },
                    country: { type: 'string' },
                }
            },
            response: {
                200: {
                    description: 'Updated profile',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        display_name: { type: 'string', nullable: true },
                        avatar_url: { type: 'string', nullable: true },
                        updated_at: { type: 'string' },
                    },
                },
                400: {
                    description: 'Validation failed',
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        errors: { type: 'array', items: { type: 'object', additionalProperties: true } }
                    }
                },
                401: { type: 'object', properties: { message: { type: 'string' } } },
                500: {
                    description: 'Update failed',
                    type: 'object',
                    properties: {
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const user = request.user!;

        // Validate body with Zod
        const result = UpdateProfileSchema.safeParse(request.body);

        if (!result.success) {
            return reply.code(400).send({
                message: 'Validation failed',
                errors: result.error.issues
            });
        }

        const updates = result.data;

        const { data, error } = await request.server.db.service
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

        if (error) {
            request.log.error({ err: error }, 'Update profile failed');
            return reply.code(500).send({ message: 'Update failed' });
        }

        return data;
    });
}
