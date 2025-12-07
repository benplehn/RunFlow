import { FastifyInstance } from 'fastify';

export async function authRoutes(fastify: FastifyInstance) {
    fastify.get('/me', {
        preHandler: [fastify.requireAuth],
        schema: {
            description: 'Get current user profile',
            tags: ['auth'],
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string' },
                        app_metadata: { type: 'object', additionalProperties: true },
                        user_metadata: { type: 'object', additionalProperties: true },
                        created_at: { type: 'string', format: 'date-time' },
                    },
                },
                401: {
                    description: 'Unauthorized',
                    type: 'object',
                    properties: {
                        code: { type: 'string', example: 'UNAUTHORIZED' },
                        message: { type: 'string', example: 'Missing Authorization header' },
                    },
                },
            },
        },
    }, async (request) => {
        // The user property is populated by the requireAuth middleware
        return request.user;
    });
}
