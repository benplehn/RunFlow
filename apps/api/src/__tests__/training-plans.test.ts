import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../server';
import { loadConfig } from '../config';
import { ensureSupabaseEnv } from './test-utils';
import { createServiceClient, resetClients } from '@runflow/db';

describe('Training Plans - Comprehensive Integration Tests', () => {
  let server: FastifyInstance;
  let userAToken: string;
  let userBToken: string;
  let userAId: string;
  let userBId: string;

  // Helper to create a user and return token + id
  const createTestUser = async (emailPrefix: string) => {
    const config = loadConfig();
    const adminClient = createServiceClient({
      supabaseUrl: config.supabase.url,
      supabaseAnonKey: config.supabase.anonKey,
      supabaseServiceRoleKey: config.supabase.serviceRoleKey
    });

    const email = `${emailPrefix}-${Date.now()}@test.com`;
    const password = 'test-password-123';

    const {
      data: { user },
      error: createError
    } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (createError || !user)
      throw new Error(
        `Failed to create ${emailPrefix}: ${createError?.message}`
      );

    const {
      data: { session },
      error: loginError
    } = await adminClient.auth.signInWithPassword({
      email,
      password
    });
    if (loginError || !session)
      throw new Error(`Failed to login ${emailPrefix}`);

    // Create profile
    await adminClient
      .from('profiles')
      .upsert({ id: user.id, display_name: emailPrefix });

    return { token: session.access_token, id: user.id };
  };

  beforeAll(async () => {
    resetClients();
    ensureSupabaseEnv();
    const config = loadConfig();
    server = await createServer(config);
    await server.ready();

    // Create two isolated users
    const userA = await createTestUser('user-a');
    userAToken = userA.token;
    userAId = userA.id;

    const userB = await createTestUser('user-b');
    userBToken = userB.token;
    userBId = userB.id;
  });

  afterAll(async () => {
    // Cleanup users
    if (server) {
      if (userAId) await server.db.service.auth.admin.deleteUser(userAId);
      if (userBId) await server.db.service.auth.admin.deleteUser(userBId);
      await server.close();
    }
  });

  describe('Data Isolation (RLS)', () => {
    it('User A can create a plan', async () => {
      const payload = {
        name: 'User A Plan',
        description: 'My secret plan',
        start_date: new Date().toISOString().split('T')[0],
        duration_weeks: 12
      };

      const response = await server.inject({
        method: 'POST',
        url: '/me/training-plans',
        headers: { authorization: `Bearer ${userAToken}` },
        payload
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.name).toBe(payload.name);
      expect(body.id).toBeDefined();
    });

    it("User B CANNOT see User A's plan", async () => {
      // User A's plan exists (from previous test), now User B requests list
      const response = await server.inject({
        method: 'GET',
        url: '/me/training-plans',
        headers: { authorization: `Bearer ${userBToken}` }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
      // User B should see 0 plans initially
      expect(body.length).toBe(0);
    });
  });

  describe('Cascade Deletion', () => {
    it('Deleting a plan removes associated weeks and sessions', async () => {
      // 1. Create a plan for User A
      const createRes = await server.inject({
        method: 'POST',
        url: '/me/training-plans',
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {
          name: 'Plan to Delete',
          start_date: new Date().toISOString().split('T')[0],
          duration_weeks: 4
        }
      });
      const planId = JSON.parse(createRes.body).id;

      // 2. Manually seed child data (Weeks & Sessions) using local admin client for robustness
      resetClients(); // Force new instance to bypass potential server singleton issues
      const config = loadConfig();
      const adminClient = createServiceClient({
        supabaseUrl: config.supabase.url,
        supabaseAnonKey: config.supabase.anonKey,
        supabaseServiceRoleKey: config.supabase.serviceRoleKey
      });

      const weekRes = await adminClient
        .from('planned_weeks')
        .insert({
          plan_id: planId,
          week_number: 1,
          volume_distance: 10,
          volume_duration: 60
        })
        .select()
        .single();
      expect(weekRes.error).toBeNull();
      const weekId = weekRes.data!.id;

      const sessionRes = await adminClient
        .from('planned_sessions')
        .insert({
          week_id: weekId,
          day_of_week: 1,
          session_type: 'run',
          target_duration: 30
        })
        .select();
      expect(sessionRes.error).toBeNull();

      // 3. Delete the plan via API
      const deleteRes = await server.inject({
        method: 'DELETE',
        url: `/me/training-plans/${planId}`,
        headers: { authorization: `Bearer ${userAToken}` }
      });
      expect(deleteRes.statusCode).toBe(204);

      // 4. Verify Database Cascade
      // Plan should be gone
      const { count: planCount } = await server.db.service
        .from('user_training_plans')
        .select('*', { count: 'exact', head: true })
        .eq('id', planId);
      expect(planCount).toBe(0);

      // Weeks should be gone
      const { count: weekCount } = await server.db.service
        .from('planned_weeks')
        .select('*', { count: 'exact', head: true })
        .eq('plan_id', planId);
      expect(weekCount).toBe(0);

      // Sessions should be gone (linked via week)
      const { count: sessionCount } = await server.db.service
        .from('planned_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('week_id', weekId);
      expect(sessionCount).toBe(0);
    });
  });

  describe('Validation & Error Handling', () => {
    it('Rejects invalid payload (negative duration)', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/me/training-plans',
        headers: { authorization: `Bearer ${userAToken}` },
        payload: {
          name: 'Bad Plan',
          start_date: '2025-01-01',
          duration_weeks: -5 // Invalid
        }
      });
      expect(response.statusCode).toBe(400); // Bad Request
    });

    it('Rejects deletion of non-existent plan', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/me/training-plans/00000000-0000-0000-0000-000000000000',
        headers: { authorization: `Bearer ${userAToken}` }
      });
      expect(response.statusCode).toBe(404);
    });
  });
});
