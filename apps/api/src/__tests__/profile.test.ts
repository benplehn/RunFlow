import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../server';
import { loadConfig } from '../config';
import { ensureSupabaseEnv } from './test-utils';

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
        email: 'test@example.com',
    };

    const mockProfile = {
        id: 'test-user-id',
        display_name: 'Test Runner',
        country: 'FR',
        avatar_url: 'https://example.com/avatar.jpg',
        created_at: new Date().toISOString(),
    };

    describe('GET /me/profile', () => {
        it('returns 401 if not authenticated', async () => {
            const response = await server.inject({
                method: 'GET',
                url: '/me/profile',
            });
            expect(response.statusCode).toBe(401);
        });

        it('returns profile data if authenticated', async () => {
            // Mock Auth
            server.db.anon.auth.getUser = vi.fn().mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });

            // Mock DB: from('profiles').select(...).eq(...).single()
            const fromSpy = vi.spyOn(server.db.service, 'from');

            // We need to return a chainable mock object
            const selectMock = vi.fn();
            const eqMock = vi.fn();
            const singleMock = vi.fn().mockResolvedValue({ data: mockProfile, error: null });

            fromSpy.mockReturnValue({
                select: selectMock.mockReturnValue({
                    eq: eqMock.mockReturnValue({
                        single: singleMock,
                    }),
                }),
            } as any);

            const response = await server.inject({
                method: 'GET',
                url: '/me/profile',
                headers: { authorization: 'Bearer token' },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.id).toBe(mockUser.id);
            expect(body.display_name).toBe('Test Runner');
        });
    });

    describe('PUT /me/profile', () => {
        it('updates profile and returns new data', async () => {
            // Mock Auth
            server.db.anon.auth.getUser = vi.fn().mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });

            // Mock DB: from('profiles').update(...).eq(...).select().single()
            const fromSpy = vi.spyOn(server.db.service, 'from');

            const updateMock = vi.fn();
            const eqMock = vi.fn();
            const selectMock = vi.fn();
            const singleMock = vi.fn().mockResolvedValue({
                data: { ...mockProfile, display_name: 'Updated Name' },
                error: null
            });

            fromSpy.mockReturnValue({
                update: updateMock.mockReturnValue({
                    eq: eqMock.mockReturnValue({
                        select: selectMock.mockReturnValue({
                            single: singleMock,
                        }),
                    }),
                }),
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
        });

        it('validates input with Zod', async () => {
            // Mock Auth
            server.db.anon.auth.getUser = vi.fn().mockResolvedValue({
                data: { user: mockUser },
                error: null,
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
