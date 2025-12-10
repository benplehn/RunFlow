import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../server';
import { loadConfig } from '../config';
import { ensureSupabaseEnv } from './test-utils';
import {
  createAnonClient,
  createServiceClient,
  resetClients
} from '@runflow/db';
import type { SupabaseClient, Database } from '@runflow/db';

describe('Sessions API E2E', () => {
  let server: FastifyInstance;
  let authToken: string;
  let userId: string;
  let adminClient: SupabaseClient<Database>;

  beforeAll(async () => {
    resetClients();
    ensureSupabaseEnv();
    const config = loadConfig();

    server = await createServer(config);
    await server.ready();

    adminClient = createServiceClient({
      supabaseUrl: config.supabase.url,
      supabaseAnonKey: config.supabase.anonKey,
      supabaseServiceRoleKey: config.supabase.serviceRoleKey
    });

    const email = `session-test-${Date.now()}@runflow.com`;
    const password = 'TestPassword123!';

    const {
      data: { user },
      error: createError
    } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (createError) throw createError;
    userId = user!.id;

    const {
      data: { session },
      error: loginError
    } = await adminClient.auth.signInWithPassword({
      email,
      password
    });
    if (loginError) throw loginError;
    authToken = session!.access_token;
  });

  afterAll(async () => {
    if (userId && adminClient) await adminClient.auth.admin.deleteUser(userId);
    if (server) await server.close();
  });

  it(' should create a new session', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/me/sessions',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        startTime: new Date().toISOString()
      }
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.id).toBeDefined();
    expect(body.status).toBe('in_progress');

    return body.id;
  });

  it('should ingest batch points', async () => {
    // First create a session
    const createRes = await server.inject({
      method: 'POST',
      url: '/me/sessions',
      headers: { authorization: `Bearer ${authToken}` },
      payload: { startTime: new Date().toISOString() }
    });
    const { id: sessionId } = JSON.parse(createRes.body);

    const points = [
      {
        timestamp: new Date().toISOString(),
        lat: 48.8566,
        lon: 2.3522,
        heartRate: 150
      },
      {
        timestamp: new Date(Date.now() + 1000).toISOString(),
        lat: 48.8567,
        lon: 2.3523,
        heartRate: 152
      }
    ];

    const res = await server.inject({
      method: 'POST',
      url: `/me/sessions/${sessionId}/points`,
      headers: { authorization: `Bearer ${authToken}` },
      payload: { points }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.count).toBe(2);

    // Verify in DB
    const { count } = await adminClient
      .from('session_points')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    expect(count).toBe(2);
  });

  it('should update session status and metrics', async () => {
    // Create session
    const createRes = await server.inject({
      method: 'POST',
      url: '/me/sessions',
      headers: { authorization: `Bearer ${authToken}` },
      payload: { startTime: new Date().toISOString() }
    });
    const { id: sessionId } = JSON.parse(createRes.body);

    // Update session
    const updateRes = await server.inject({
      method: 'PATCH',
      url: `/me/sessions/${sessionId}`,
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        status: 'completed',
        endTime: new Date().toISOString(),
        metrics: { distance: 5000, duration: 1800 }
      }
    });

    expect(updateRes.statusCode).toBe(200);
    const updatedBody = JSON.parse(updateRes.body);
    expect(updatedBody.status).toBe('completed');
    expect(updatedBody.end_time).toBeDefined();
    // Updated route returns the updated object directly or we might need to verify via DB if response is minimal
    // Given implementation standard, it usually returns the updated record.
  });

  it('should prevent access to other users sessions', async () => {
    // 1. Create session as User A (existing setup)
    const createRes = await server.inject({
      method: 'POST',
      url: '/me/sessions',
      headers: { authorization: `Bearer ${authToken}` },
      payload: { startTime: new Date().toISOString() }
    });
    const { id: sessionId } = JSON.parse(createRes.body);

    // 2. Create User B
    const emailB = `hacker-${Date.now()}@test.com`;
    const {
      data: { user: userB }
    } = await adminClient.auth.admin.createUser({
      email: emailB,
      password: 'Password123!',
      email_confirm: true
    });

    // Use Anon client for User B login to avoid tainting the singleton Service Client with a session
    const anonClient = createAnonClient({
      supabaseUrl: process.env.SUPABASE_URL!,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY!
    });

    const { data } = await anonClient.auth.signInWithPassword({
      email: emailB,
      password: 'Password123!'
    });
    const tokenB = data.session!.access_token;

    // 3. User B tries to post points to User A's session
    const res = await server.inject({
      method: 'POST',
      url: `/me/sessions/${sessionId}/points`,
      headers: { authorization: `Bearer ${tokenB}` },
      payload: {
        points: [{ timestamp: new Date().toISOString(), lat: 0, lon: 0 }]
      }
    });

    // Expect 404 (Not Found) because we filter by user_id in the query
    expect(res.statusCode).toBe(404);

    // Cleanup User B
    await adminClient.auth.admin.deleteUser(userB!.id);
  });

  describe('Validation Errors', () => {
    it('should return 400 for invalid session creation payload', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/me/sessions',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { startTime: 12345 } // Invalid type (number instead of string)
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error).toBe('Validation Error');
    });

    it('should return 400 for invalid session update payload', async () => {
      // Create a valid session first
      const createRes = await server.inject({
        method: 'POST',
        url: '/me/sessions',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { startTime: new Date().toISOString() }
      });

      expect(createRes.statusCode).toBe(201);
      const { id } = JSON.parse(createRes.body);

      const res = await server.inject({
        method: 'PATCH',
        url: `/me/sessions/${id}`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { status: 123 } // Invalid type
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error).toBe('Validation Error');
    });

    it('should return 400 for invalid points payload', async () => {
      // Create a valid session first
      const createRes = await server.inject({
        method: 'POST',
        url: '/me/sessions',
        headers: { authorization: `Bearer ${authToken}` },
        payload: { startTime: new Date().toISOString() }
      });

      expect(createRes.statusCode).toBe(201);
      const { id } = JSON.parse(createRes.body);

      const res = await server.inject({
        method: 'POST',
        url: `/me/sessions/${id}/points`,
        headers: { authorization: `Bearer ${authToken}` },
        payload: { points: [{ lat: 'invalid' }] } // Invalid type for lat
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.error).toBe('Validation Error');
    });
  });
});
