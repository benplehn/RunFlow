import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../server';
import { loadConfig } from '../config';
import { ensureSupabaseEnv } from './test-utils';
import { createServiceClient, resetClients } from '@runflow/db';
import type { SupabaseClient, Database } from '@runflow/db';

describe('Groups API Integration Tests', () => {
  let server: FastifyInstance;
  let adminClient: SupabaseClient<Database>;

  // User 1: Owner
  let ownerToken: string;
  let ownerId: string;

  // User 2: Member
  let memberToken: string;
  let memberId: string;

  // User 3: Outsider
  let outsiderToken: string;
  let outsiderId: string;

  let createdGroupId: string;

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

    // Helper to create user and get token
    const createTestUser = async (prefix: string) => {
      const email = `groups-test-${prefix}-${Date.now()}@integration.com`;
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

      const {
        data: { session },
        error: loginError
      } = await adminClient.auth.signInWithPassword({
        email,
        password
      });
      if (loginError) throw loginError;

      return { id: user!.id, token: session!.access_token };
    };

    const owner = await createTestUser('owner');
    ownerId = owner.id;
    ownerToken = owner.token;

    const member = await createTestUser('member');
    memberId = member.id;
    memberToken = member.token;

    const outsider = await createTestUser('outsider');
    outsiderId = outsider.id;
    outsiderToken = outsider.token;
  });

  afterAll(async () => {
    if (ownerId) await adminClient.auth.admin.deleteUser(ownerId);
    if (memberId) await adminClient.auth.admin.deleteUser(memberId);
    if (outsiderId) await adminClient.auth.admin.deleteUser(outsiderId);
    await server.close();
  });

  it('Flow: Create Group -> Join -> Create Event -> List Events', async () => {
    // 1. Owner creates a group
    const createRes = await server.inject({
      method: 'POST',
      url: '/me/groups',
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        name: `Runners Club ${Date.now()}`,
        description: 'Best club ever',
        visibility: 'public'
      }
    });

    if (createRes.statusCode !== 201) {
      console.log('Create Group Error:', createRes.body);
    }

    expect(createRes.statusCode).toBe(201);
    const group = JSON.parse(createRes.body);
    expect(group.id).toBeDefined();
    expect(group.name).toContain('Runners Club');
    createdGroupId = group.id;

    // 2. Member joins the group
    const joinRes = await server.inject({
      method: 'POST',
      url: `/me/groups/${createdGroupId}/join`,
      headers: { authorization: `Bearer ${memberToken}` }
    });
    expect(joinRes.statusCode).toBe(200);
    expect(JSON.parse(joinRes.body).success).toBe(true);

    // 3. Member lists their groups - should verify membership
    const myGroupsRes = await server.inject({
      method: 'GET',
      url: '/me/groups',
      headers: { authorization: `Bearer ${memberToken}` }
    });
    expect(myGroupsRes.statusCode).toBe(200);
    const myGroups = JSON.parse(myGroupsRes.body);
    expect(myGroups.some((g: { id: string }) => g.id === createdGroupId)).toBe(
      true
    );

    // 4. Member creates an event
    const eventTime = new Date();
    eventTime.setDate(eventTime.getDate() + 1); // Tomorrow

    const eventRes = await server.inject({
      method: 'POST',
      url: `/me/groups/${createdGroupId}/events`,
      headers: { authorization: `Bearer ${memberToken}` },
      payload: {
        title: 'Sunday Long Run',
        description: '20km easy pace',
        startTime: eventTime.toISOString(),
        location: 'Central Park'
      }
    });

    expect(eventRes.statusCode).toBe(201);
    const event = JSON.parse(eventRes.body);
    expect(event.title).toBe('Sunday Long Run');

    // 5. Owner lists events (verifies Owner is also a member/has access)
    const listRes = await server.inject({
      method: 'GET',
      url: `/me/groups/${createdGroupId}/events`,
      headers: { authorization: `Bearer ${ownerToken}` }
    });

    expect(listRes.statusCode).toBe(200);
    const events = JSON.parse(listRes.body);
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0].title).toBe('Sunday Long Run');
  });

  it('Edge Case: Cannot join same group twice', async () => {
    const joinRes = await server.inject({
      method: 'POST',
      url: `/me/groups/${createdGroupId}/join`,
      headers: { authorization: `Bearer ${memberToken}` }
    });
    // Expectations: either 409 (Conflict) or idempotent success 200.
    // My implementation returns 409 if unique violation occurs.
    expect(joinRes.statusCode).toBe(409);
    expect(JSON.parse(joinRes.body).error).toBe('Already a member');
  });

  it('Flow: Member Leave Group -> Cannot List Events', async () => {
    // 1. Leave
    const leaveRes = await server.inject({
      method: 'POST',
      url: `/me/groups/${createdGroupId}/leave`,
      headers: { authorization: `Bearer ${memberToken}` }
    });
    expect(leaveRes.statusCode).toBe(200);

    // 2. Verify removed from list
    const myGroupsRes = await server.inject({
      method: 'GET',
      url: '/me/groups',
      headers: { authorization: `Bearer ${memberToken}` }
    });
    const myGroups = JSON.parse(myGroupsRes.body);
    expect(myGroups.some((g: { id: string }) => g.id === createdGroupId)).toBe(
      false
    );

    // 3. Verify cannot list events anymore
    const listRes = await server.inject({
      method: 'GET',
      url: `/me/groups/${createdGroupId}/events`,
      headers: { authorization: `Bearer ${memberToken}` }
    });
    expect(listRes.statusCode).toBe(403);
  });

  it('RLS: Outsider cannot list events', async () => {
    const listRes = await server.inject({
      method: 'GET',
      url: `/me/groups/${createdGroupId}/events`,
      headers: { authorization: `Bearer ${outsiderToken}` }
    });

    // API logic explicitly returns 403
    expect(listRes.statusCode).toBe(403);
  });

  it('RLS: Outsider cannot create events', async () => {
    const eventRes = await server.inject({
      method: 'POST',
      url: `/me/groups/${createdGroupId}/events`,
      headers: { authorization: `Bearer ${outsiderToken}` },
      payload: {
        title: 'Hacker Run',
        startTime: new Date().toISOString()
      }
    });

    expect(eventRes.statusCode).toBe(403);
  });

  it('Validation: Create Group with invalid input returns 400', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/me/groups',
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: {
        // Missing name
        description: 'Invalid group'
      }
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toBe('Validation Error');
  });

  it('Edge Case: Create Group with duplicate name returns 409', async () => {
    const uniqueName = `Duplicate Test ${Date.now()}`;

    // First creation -> 201
    const res1 = await server.inject({
      method: 'POST',
      url: '/me/groups',
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: { name: uniqueName, visibility: 'public' }
    });
    expect(res1.statusCode).toBe(201);

    // Second creation -> 409
    const res2 = await server.inject({
      method: 'POST',
      url: '/me/groups',
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: { name: uniqueName, visibility: 'public' }
    });
    expect(res2.statusCode).toBe(409);
    expect(JSON.parse(res2.body).error).toBe('Group name already taken');
  });

  it('Validation: Create Event with invalid input returns 400', async () => {
    const res = await server.inject({
      method: 'POST',
      url: `/me/groups/${createdGroupId}/events`,
      headers: { authorization: `Bearer ${memberToken}` }, // Assuming member token is valid from previous tests context if order preserved, or just use ownerToken which is also member
      payload: {
        // Missing title
        description: 'Invalid event'
      }
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toBe('Validation Error');
  });
});
