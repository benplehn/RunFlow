import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createServer } from '../server';
import { configSchema } from '@runflow/config';

// Mock dependencies
vi.mock('@runflow/db', () => ({
  createAnonClient: vi.fn(),
  createServiceClient: vi.fn().mockReturnValue({
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null })
    },
    from: vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null })
    })
  }),
  Json: Object
}));

// Mock Queue
vi.mock('../queues', () => ({
  syncStravaQueue: {
    add: vi.fn()
  }
}));
import { syncStravaQueue } from '../queues';

// Mock Fetch
global.fetch = vi.fn();

describe('Integrations API', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();

    server = await createServer({
      ...configSchema.parse({
        nodeEnv: 'test',
        supabase: {
          url: 'https://test.com',
          anonKey: 'key',
          serviceRoleKey: 'key',
          jwtSecret: 'secret'
        },
        redis: { url: 'redis://localhost:6379' },
        strava: { clientId: '123', clientSecret: 'secret' }
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  it('GET /integrations/strava/auth-url returns correct url', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/integrations/strava/auth-url'
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.url).toContain('https://www.strava.com/oauth/authorize');
    expect(body.url).toContain('client_id=123');
    expect(body.url).toContain('scope=activity%3Aread_all');
  });

  it('POST /integrations/strava/exchange handles token exchange', async () => {
    // Mock Strava token response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'at_123',
        refresh_token: 'rt_123',
        expires_at: 1234567890
      })
    });

    const response = await server.inject({
      method: 'POST',
      url: '/integrations/strava/exchange',
      headers: { Authorization: 'Bearer test-token' },
      payload: { code: 'auth_code_123' }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ success: true });

    // Verify DB update called
    // In real test we'd inspect the mock call arguments deeper
    expect(syncStravaQueue.add).toHaveBeenCalledWith('initial-sync', {
      userId: 'user-123',
      fullSync: true
    });
  });

  it('POST /integrations/strava/sync triggers manual sync', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/integrations/strava/sync',
      headers: { Authorization: 'Bearer test-token' }
    });

    expect(response.statusCode).toBe(200);
    expect(syncStravaQueue.add).toHaveBeenCalledWith('manual-sync', {
      userId: 'user-123',
      fullSync: false
    });
  });
});
