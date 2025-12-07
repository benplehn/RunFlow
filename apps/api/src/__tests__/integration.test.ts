import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../server';
import { loadConfig } from '../config';
import { ensureSupabaseEnv } from './test-utils';
import { createServiceClient, resetClients } from '@runflow/db';

import type { SupabaseClient, Database } from '@runflow/db';

describe('Profile API Integration Tests', () => {
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

    // Admin client for setup
    adminClient = createServiceClient({
      supabaseUrl: config.supabase.url,
      supabaseAnonKey: config.supabase.anonKey,
      supabaseServiceRoleKey: config.supabase.serviceRoleKey
    });

    // 1. Create a test user
    const email = `profile-test-${Date.now()}@integration.com`;
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

    // 2. Login to get token
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
    if (userId && adminClient) {
      await adminClient.auth.admin.deleteUser(userId);
    }
    await server.close();
  });

  it('GET /me/profile returns 200 if profile exists', async () => {
    // Verify user profile handling
    // We explicitly ensure the profile exists via upsert to guarantee a known state,
    // regardless of whether an auth trigger is active or not.
    const { error } = await adminClient.from('profiles').upsert({
      id: userId,
      display_name: 'Initial Name'
    });
    expect(error).toBeNull();

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
    const newName = 'Updated Name';

    const response = await server.inject({
      method: 'PUT',
      url: '/me/profile',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        display_name: newName,
        country: 'FR'
      }
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.display_name).toBe(newName);

    // Verify in DB via Admin Client (bypassing RLS)
    const { data } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    expect(data).not.toBeNull();
    expect(data!.display_name).toBe(newName);
    expect(data!.country).toBe('FR');
  });
});
