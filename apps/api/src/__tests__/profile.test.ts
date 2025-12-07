import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  vi,
  beforeEach
} from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../server';
import { loadConfig } from '../config';
import { ensureSupabaseEnv } from './test-utils';

// Mock the DB package
vi.mock('@runflow/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@runflow/db')>();
  return {
    ...actual,
    createAuthenticatedClient: vi.fn()
  };
});

import { createAuthenticatedClient } from '@runflow/db';

describe('Profile Routes', () => {
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

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com'
  };

  const mockProfile = {
    id: 'test-user-id',
    display_name: 'Test Runner',
    country: 'FR',
    avatar_url: 'https://example.com/avatar.jpg',
    created_at: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /me/profile', () => {
    it('returns 401 if not authenticated', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/me/profile'
      });
      expect(response.statusCode).toBe(401);
    });

    it('returns profile data if authenticated', async () => {
      // Mock Auth via server helper mechanism (or assume requireAuth passes if we mock the request decoration)
      // Actually, requireAuth uses server.db.anon.auth.getUser
      server.db.anon.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // Mock createAuthenticatedClient to return our Chainable mock
      const singleMock = vi
        .fn()
        .mockResolvedValue({ data: mockProfile, error: null });
      const eqMock = vi.fn().mockReturnValue({ single: singleMock });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
      const fromMock = vi.fn().mockReturnValue({ select: selectMock });

      vi.mocked(createAuthenticatedClient).mockReturnValue({
        from: fromMock
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const response = await server.inject({
        method: 'GET',
        url: '/me/profile',
        headers: { authorization: 'Bearer token' }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(mockUser.id);
      expect(body.display_name).toBe('Test Runner');

      // Verification
      expect(createAuthenticatedClient).toHaveBeenCalled();
      expect(fromMock).toHaveBeenCalledWith('profiles');
      // RLS is assumed, but we check if we called eq(id, user.id) as strictly implemented
      expect(eqMock).toHaveBeenCalledWith('id', mockUser.id);
    });
  });

  describe('PUT /me/profile', () => {
    it('updates profile and returns new data', async () => {
      // Mock Auth
      server.db.anon.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // Mock createAuthenticatedClient
      const singleMock = vi.fn().mockResolvedValue({
        data: { ...mockProfile, display_name: 'Updated Name' },
        error: null
      });
      const selectMock = vi.fn().mockReturnValue({ single: singleMock });
      const eqMock = vi.fn().mockReturnValue({ select: selectMock });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
      const fromMock = vi.fn().mockReturnValue({ update: updateMock });

      vi.mocked(createAuthenticatedClient).mockReturnValue({
        from: fromMock
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const response = await server.inject({
        method: 'PUT',
        url: '/me/profile',
        headers: { authorization: 'Bearer token' },
        payload: {
          display_name: 'Updated Name',
          country: 'US'
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.display_name).toBe('Updated Name');

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ display_name: 'Updated Name' })
      );
    });

    it('validates input with Zod', async () => {
      // Mock Auth
      server.db.anon.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const response = await server.inject({
        method: 'PUT',
        url: '/me/profile',
        headers: { authorization: 'Bearer token' },
        payload: {
          avatar_url: 'not-a-url' // Error!
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Validation failed');
    });
  });
});
