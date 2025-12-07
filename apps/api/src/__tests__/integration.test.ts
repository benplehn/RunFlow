import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../server';
import { loadConfig } from '../config';
import { ensureSupabaseEnv } from './test-utils';
import { createServiceClient, resetClients } from '@runflow/db';

// This test suite requires a running Supabase instance.
// It performs real DB operations.
describe('Full Stack Integration Tests', () => {
  let server: FastifyInstance;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    resetClients(); // Force fresh client creation with new env vars
    ensureSupabaseEnv();
    const config = loadConfig();
    console.log('--- TEST CONFIG DEBUG ---');
    console.log('Supabase URL:', config.supabase.url);
    console.log(
      'Service Key Start:',
      config.supabase.serviceRoleKey?.substring(0, 10)
    );
    console.log('-------------------------');
    server = await createServer(config);
    await server.ready();

    // Verify connection to real Supabase
    const { error: healthError } = await server.db.service
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (healthError) {
      console.warn(
        'Skipping integration tests: Cannot connect to Supabase.',
        JSON.stringify(healthError)
      );
      throw new Error(
        `Supabase connection failed: ${JSON.stringify(healthError)}`
      );
    }

    // Create a real test user
    const adminClient = createServiceClient({
      supabaseUrl: config.supabase.url,
      supabaseAnonKey: config.supabase.anonKey,
      supabaseServiceRoleKey: config.supabase.serviceRoleKey
    });

    const email = `test-${Date.now()}@integration.com`;
    const password = 'test-password-123';

    const {
      data: { user },
      error: createError
    } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (createError || !user) {
      throw new Error(`Failed to create test user: ${createError?.message}`);
    }

    userId = user.id;

    // Login to get the session/token (or sign in with password to simulate real flow)
    const {
      data: { session },
      error: loginError
    } = await adminClient.auth.signInWithPassword({
      email,
      password
    });

    if (loginError || !session) {
      throw new Error(`Failed to login test user: ${loginError?.message}`);
    }

    authToken = session.access_token;
  });

  afterAll(async () => {
    // Cleanup: Delete the test user ?
    // Usually good practice.
    if (userId && server) {
      await server.db.service.auth.admin.deleteUser(userId);
    }
    if (server) await server.close();
  });

  it('GET /me/profile returns profile after manual creation', async () => {
    // We manually upsert the profile to ensure it exists for the test user.
    // With Supabase Cloud, the Service Role should correctly bypass RLS.
    const { error: insertError } = await server.db.service
      .from('profiles')
      .upsert({
        id: userId,
        display_name: 'Integration Test User'
      });

    if (insertError) {
      throw new Error(`Profile insert failed: ${insertError.message}`);
    }

    const response = await server.inject({
      method: 'GET',
      url: '/me/profile',
      headers: { authorization: `Bearer ${authToken}` }
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.id).toBe(userId);
  });

  it('PUT /me/profile updates the profile', async () => {
    const newName = 'Integration Tester';

    const response = await server.inject({
      method: 'PUT',
      url: '/me/profile',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        display_name: newName,
        country: 'US'
      }
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.display_name).toBe(newName);

    // Verify directly in DB
    const { data } = await server.db.service
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    expect(data.display_name).toBe(newName);
  });
});
