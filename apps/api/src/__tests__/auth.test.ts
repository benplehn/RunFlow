import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../server';
import { loadConfig } from '../config';
import { ensureSupabaseEnv } from './test-utils';

describe('Auth Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    ensureSupabaseEnv();
    const config = loadConfig();
    server = await createServer(config);
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /me', () => {
    it('returns 401 without token', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/me'
      });
      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 with invalid token', async () => {
      // Mock auth failure
      const originalGetUser = server.db.anon.auth.getUser;
      server.db.anon.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      });

      const response = await server.inject({
        method: 'GET',
        url: '/me',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      });

      expect(response.statusCode).toBe(401);

      // Restore
      server.db.anon.auth.getUser = originalGetUser;
    });

    it('returns 200 with valid token', async () => {
      // Mock auth success
      const originalGetUser = server.db.anon.auth.getUser;
      const mockUser = { id: 'test-user-id', email: 'test@example.com' };

      server.db.anon.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const response = await server.inject({
        method: 'GET',
        url: '/me',
        headers: {
          authorization: 'Bearer valid-token'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(mockUser.id);
      expect(body.email).toBe(mockUser.email);

      // Restore
      server.db.anon.auth.getUser = originalGetUser;
    });
  });
});
