import { describe, it, expect, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createServer } from '../server';
import { loadConfig } from '../config';
import { GeneratePlanInput } from '@runflow/schemas';
import jwt from 'jsonwebtoken';

describe('POST /me/training-plans/generate', () => {
  let app: FastifyInstance;
  let validToken: string;

  beforeEach(async () => {
    const config = loadConfig();
    // Use real DB config from .env (loadConfig does this by default if not mocked)

    // Generate a valid JWT signed with the secret from .env
    // We need a valid UUID for the user. We assume one exists or random is fine if RLS allows inserts.
    // For 'user_training_plans', RLS requires 'auth.uid() = user_id'.
    // So we can start with any random UUID as the user ID in the token,
    // and when we insert, the RPC uses auth.uid(), so it matches!
    // We don't strictly need a row in 'public.profiles' UNLESS there is a foreign key constraint.
    // schema: user_id UUID NOT NULL REFERENCES public.profiles(id)
    // YES, there is a FK. So we strictly NEED a profile in public.profiles.
    // We must create one, or use an existing one.
    // Since we can't easily create a profile without being an admin or signing up via Auth (which creates auth.user then trigger creates profile),
    // we might need to insert a dummy profile directly via Service Role client first.

    app = await createServer(config);

    // 1. Create a dummy user profile via DB Service Client
    const serviceClient = app.db.service;
    // Ideally random to avoid collisions
    const randomId = crypto.randomUUID();

    // We need to bypass the fact that profiles usually reference auth.users.
    // Does public.profiles have FK to auth.users?
    // Usually yes: id references auth.users(id).
    // If so, we can't insert into profiles unless user exists in auth.users.
    // We can't insert into auth.users easily via client (needs admin API).
    // supabase.auth.admin.createUser()

    const { data: user, error: createError } =
      await serviceClient.auth.admin.createUser({
        email: `test-${randomId}@example.com`,
        password: 'password123',
        email_confirm: true
      });

    if (createError || !user.user) {
      // Fallback if admin API is not enabled/working or we are in a limited env:
      // We can try signing a token with a random ID and hope there is no FK?
      // Checking migration '0001_init.sql' or '0002_app_schema.sql':
      // "user_id UUID NOT NULL REFERENCES public.profiles(id)" implies FK.
      // "create table profiles ... id references auth.users".
      // So we need a real auth user.
      // 'serviceClient.auth.admin' should work if we have service_role key.
      console.error('Failed to create test user:', createError);
      throw new Error('Failed to create test user for integration test');
    }

    const userId = user.user.id;

    // Wait for trigger to create profile? Or create manually if no trigger?
    // Usually trigger handles it. Let's wait a bit or verify.
    // Or just upsert profile ensure it exists.
    const { error: profileError } = await serviceClient
      .from('profiles')
      .upsert({
        id: userId,
        display_name: 'Test User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Failed to upsert profile:', profileError);
    }

    // 2. Sign a token for this user
    // Payload must match Supabase structure roughly
    validToken = jwt.sign(
      {
        aud: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        sub: userId,
        role: 'authenticated',
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: {}
      },
      config.supabase.jwtSecret // We need to expose this in config or load from env
    );
  });

  it('should validate input and call domain + DB', async () => {
    const payload: GeneratePlanInput = {
      objective: 'marathon',
      level: 'intermediate',
      durationWeeks: 16,
      sessionsPerWeek: 4, // > 2
      startDate: '2025-06-01'
    };

    const response = await app.inject({
      method: 'POST',
      url: '/me/training-plans/generate',
      headers: {
        authorization: `Bearer ${validToken}`
      },
      payload
    });

    if (response.statusCode !== 201) {
      console.error('Request failed:', response.body);
    }

    expect(response.statusCode).toBe(202);
    const body = JSON.parse(response.body);
    expect(body.planId).toBeDefined();
    expect(body.status).toBe('pending');

    // Legacy test kept for input validation check only.
    // Full E2E logic moved to async-plan.test.ts
  });

  it('should return 400 for invalid input', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/me/training-plans/generate',
      headers: {
        authorization: `Bearer ${validToken}`
      },
      payload: {
        objective: 'invalid'
      }
    });

    expect(response.statusCode).toBe(400);
  });
});
