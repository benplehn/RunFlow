import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../server';
import { loadConfig } from '../config';
import type { HealthResponse, DbHealthResponse } from '../types';
import { ensureSupabaseEnv } from './test-utils';

describe('Health Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    // Ensure Supabase env is defined for tests/CI (real keys if available)
    ensureSupabaseEnv();

    const config = loadConfig();
    server = await createServer(config);
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /health', () => {
    it('returns 200 with ok status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as HealthResponse;
      expect(body.status).toBe('ok');
      expect(body.timestamp).toBeDefined();
      expect(new Date(body.timestamp).getTime()).toBeGreaterThan(0);
    });
  });

  describe('GET /health/db', () => {
    it('returns 200 when database is reachable', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health/db'
      });

      const body = JSON.parse(response.body) as DbHealthResponse;
      expect(response.statusCode).toBe(200);
      expect(body.status).toBe('ok');
      expect(body.database?.connected).toBe(true);
      expect(body.timestamp).toBeDefined();
    });

    it('returns 503 when database query fails', async () => {
      // Mock the database to fail
      const originalFrom = server.db.service.from;
      vi.spyOn(server.db.service, 'from').mockImplementation(() => {
        return {
          select: () => ({
            limit: () =>
              Promise.resolve({
                error: new Error('Connection failed'),
                data: null
              })
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
      });

      const response = await server.inject({
        method: 'GET',
        url: '/health/db'
      });

      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.body) as DbHealthResponse;
      expect(body.status).toBe('error');
      expect(body.database?.connected).toBe(false);

      // Restore original
      server.db.service.from = originalFrom;
    });
  });
});
