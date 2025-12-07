import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../server';
import { loadConfig } from '../config';
import { ensureSupabaseEnv } from './test-utils';
import { createServiceClient, resetClients } from '@runflow/db';
import type { SupabaseClient, Database } from '@runflow/db';
import { Worker } from 'bullmq';
import { generatePlanProcessor } from '../../../worker/src/processors/generate-plan'; // Relative import
import IORedis from 'ioredis';

describe('Async Training Plan E2E', () => {
  let server: FastifyInstance;
  let authToken: string;
  let userId: string;
  let adminClient: SupabaseClient<Database>;
  let worker: Worker;
  let redisConnection: IORedis;

  beforeAll(async () => {
    resetClients();
    ensureSupabaseEnv();
    const config = loadConfig();

    // 1. Setup API
    server = await createServer(config);
    await server.ready();

    // 2. Setup DB Client
    adminClient = createServiceClient({
      supabaseUrl: config.supabase.url,
      supabaseAnonKey: config.supabase.anonKey,
      supabaseServiceRoleKey: config.supabase.serviceRoleKey
    });

    // 3. Create Test User
    const email = `async-test-${Date.now()}@runflow.com`;
    const password = 'TestPassword123!';

    const {
      data: { user },
      error: createError
    } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Worker User' // Trigger should pick this up
      }
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

    // 4. Setup In-Process Worker
    // Reusing the same Redis Config as API/Worker
    const redisUrl = config.redis.url;
    redisConnection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

    // Instantiate worker with the actual processor
    worker = new Worker('generate-plan', generatePlanProcessor, {
      connection: redisConnection,
      concurrency: 1
    });
  });

  afterAll(async () => {
    // Cleanup
    if (worker) await worker.close();
    if (redisConnection) await redisConnection.quit();
    if (userId && adminClient) await adminClient.auth.admin.deleteUser(userId);
    if (server) await server.close();
  });

  it('should generate a plan asynchronously', async () => {
    // 1. Trigger Generation
    const payload = {
      objective: 'marathon',
      level: 'intermediate',
      durationWeeks: 12,
      sessionsPerWeek: 4,
      startDate: new Date().toISOString().split('T')[0]
    };

    const res = await server.inject({
      method: 'POST',
      url: '/me/training-plans/generate',
      headers: { authorization: `Bearer ${authToken}` },
      payload
    });

    expect(res.statusCode).toBe(202);

    const body = JSON.parse(res.body);
    expect(body.status).toBe('pending');
    const planId = body.planId;
    expect(planId).toBeDefined();

    // 2. Poll for Completion (Worker should be processing)
    // Give it up to 10 seconds
    let status = 'pending';
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const checkRes = await server.inject({
        method: 'GET',
        url: `/me/training-plans/${planId}/status`,
        headers: { authorization: `Bearer ${authToken}` }
      });
      const checkBody = JSON.parse(checkRes.body);
      status = checkBody.status;
      if (status === 'generated' || status === 'failed') break;
    }

    expect(status).toBe('generated');

    // 3. Verify Full Data Persistence
    const { data: plan, error } = await adminClient
      .from('user_training_plans')
      .select('*, planned_weeks(*, planned_sessions(count))')
      .eq('id', planId)
      .single();

    expect(error).toBeNull();
    expect(plan).toBeDefined();
    expect(plan?.status).toBe('generated');
    // Check deep data structures were created
    // Warning: planned_sessions(count) might not work directly without exact relation syntax or manual count
    // But basic check:
    const { count: weeksCount } = await adminClient
      .from('planned_weeks')
      .select('*', { count: 'exact', head: true })
      .eq('plan_id', planId);

    expect(weeksCount).toBe(12);

    // Verify parameter respect (e.g. sessions per week)
    // Let's allow the query to be simpler: Just check total sessions = 12 * 4 = 48
    const { count: totalSessions } = await adminClient
      .from('planned_sessions')
      .select('id, planned_weeks!inner(plan_id)', {
        count: 'exact',
        head: true
      })
      .eq('planned_weeks.plan_id', planId);

    expect(totalSessions).toBe(12 * 4); // 48 sessions
  });
});
