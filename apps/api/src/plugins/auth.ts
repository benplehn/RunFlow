import fp from 'fastify-plugin';
import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Middleware/PreHandling function to ensure the user is authenticated.
 * It checks the Bearer token in the Authorization header.
 */
export const requireAuth = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return reply.status(401).send({
      code: 'UNAUTHORIZED',
      message: 'Missing Authorization header'
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return reply.status(401).send({
      code: 'UNAUTHORIZED',
      message: 'Invalid Authorization header format'
    });
  }

  const { data, error } = await request.server.db.anon.auth.getUser(token);

  if (error || !data.user) {
    request.log.warn({ err: error }, 'Authentication failed');
    return reply.status(401).send({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token'
    });
  }

  // Attach user to request
  request.user = data.user;
};

// Export plugin to register it globally or in specific scopes if needed
// For this simple case, we just export the function to be used in routes
export default fp(async (fastify) => {
  fastify.decorate('requireAuth', requireAuth);
});

// Type augmentation
declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: typeof requireAuth;
  }
}
