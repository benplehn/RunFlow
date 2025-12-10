import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { syncStravaQueue } from '../queues';

export const integrationsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /integrations/strava/auth-url
  fastify.get('/strava/auth-url', async (request, reply) => {
    const config = fastify.config;
    if (!config.strava.clientId) {
      return reply.status(500).send({ error: 'Strava not configured' });
    }

    const params = new URLSearchParams({
      client_id: config.strava.clientId,
      redirect_uri: 'http://localhost:3000/integrations/strava/callback', // Frontend URL
      response_type: 'code',
      scope: 'activity:read_all'
    });

    const url = `https://www.strava.com/oauth/authorize?${params.toString()}`;
    return { url };
  });

  // POST /integrations/strava/exchange
  fastify.post('/strava/exchange', async (request, reply) => {
    const BodySchema = z.object({
      code: z.string(),
      scope: z.string().optional()
    });

    const parseResult = BodySchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Validation Error' });
    }

    const { code } = parseResult.data;
    const config = fastify.config;

    if (!config.strava.clientId || !config.strava.clientSecret) {
      return reply.status(500).send({ error: 'Strava not configured' });
    }

    // Exchange code for token
    try {
      const tokenRes = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: config.strava.clientId,
          client_secret: config.strava.clientSecret,
          code,
          grant_type: 'authorization_code'
        })
      });

      if (!tokenRes.ok) throw new Error('Failed to exchange token');

      const tokenData = await tokenRes.json();
      const { access_token, refresh_token, expires_at } = tokenData;

      // Get User
      const authHeader = request.headers.authorization;
      if (!authHeader) return reply.status(401).send({ error: 'Unauthorized' });
      const userToken = authHeader.replace(/^Bearer\s+/i, '');
      const {
        data: { user }
      } = await fastify.db.service.auth.getUser(userToken);

      if (!user) return reply.status(401).send({ error: 'Unauthorized' });

      // Upsert Integration
      const { error } = await fastify.db.service
        .from('user_integrations')
        .upsert(
          {
            user_id: user.id,
            provider: 'strava',
            access_token,
            refresh_token,
            expires_at,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id, provider' }
        );

      if (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Database Error' });
      }

      // Initial Sync Trigger
      await syncStravaQueue.add('initial-sync', {
        userId: user.id,
        fullSync: true
      });

      return { success: true };
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Failed to connect Strava' });
    }
  });

  // POST /integrations/strava/sync
  fastify.post('/strava/sync', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) return reply.status(401).send();
    const userToken = authHeader.replace(/^Bearer\s+/i, '');
    const {
      data: { user }
    } = await fastify.db.service.auth.getUser(userToken);

    if (!user) return reply.status(401).send();

    await syncStravaQueue.add('manual-sync', {
      userId: user.id,
      fullSync: false
    });
    return { status: 'sync_started' };
  });
};
