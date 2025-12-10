import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncStravaProcessor } from '../processors/sync-strava';

// Mock Dependencies
vi.mock('@runflow/config', () => ({
  config: {
    strava: { clientId: 'test-id', clientSecret: 'test-secret' },
    redis: { url: 'redis://localhost:6379' },
    supabase: {
      url: 'https://test.com',
      anonKey: 'k',
      serviceRoleKey: 's',
      jwtSecret: 'j'
    }
  },
  loadConfig: () => ({
    strava: { clientId: 'test-id', clientSecret: 'test-secret' },
    redis: { url: 'redis://localhost:6379' },
    supabase: {
      url: 'https://test.com',
      anonKey: 'k',
      serviceRoleKey: 's',
      jwtSecret: 'j'
    }
  })
}));

// Define mockSupabase outside but accessible
const mockSupabase = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  update: vi.fn(),
  upsert: vi.fn()
}));

vi.mock('@runflow/db', () => ({
  createServiceClient: () => mockSupabase,
  createAnonClient: vi.fn(),
  SupabaseClientConfig: {}
}));

global.fetch = vi.fn();

describe('Sync Strava Processor', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup fluent chain for supabase
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.single.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);
    mockSupabase.upsert.mockReturnValue({ error: null });
  });

  it('should throw if integration not found', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: 'Not found'
    });

    await expect(
      syncStravaProcessor({
        data: { userId: 'u1', fullSync: false },
        log: vi.fn()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as unknown as any)
    ).rejects.toThrow('Strava integration not found');
  });

  it('should refresh token if expired', async () => {
    const expiredTime = Math.floor(Date.now() / 1000) - 1000;
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'int-1',
        access_token: 'old_at',
        refresh_token: 'rt',
        expires_at: expiredTime
      },
      error: null
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'new_at',
        refresh_token: 'new_rt',
        expires_at: 9999999999
      })
    });

    // Mock activities fetch (empty for this test)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    await syncStravaProcessor({
      data: { userId: 'u1', fullSync: false },
      log: vi.fn()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as unknown as any);

    expect(mockSupabase.update).toHaveBeenCalledWith({
      access_token: 'new_at',
      refresh_token: 'new_rt',
      expires_at: 9999999999,
      updated_at: expect.any(String)
    });
  });

  it('should sync activities', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'int-1',
        access_token: 'valid_at',
        expires_at: 9999999999,
        sync_cursor: 1000
      },
      error: null
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 123,
          type: 'Run',
          start_date: '2023-01-01T10:00:00Z',
          elapsed_time: 3600,
          distance: 10000,
          moving_time: 3500,
          total_elevation_gain: 100
        }
      ]
    });

    const result = await syncStravaProcessor({
      data: { userId: 'u1', fullSync: false },
      log: vi.fn()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as unknown as any);

    expect(result.synced).toBe(1);
    expect(mockSupabase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics: expect.objectContaining({ strava_id: 123 })
      }),
      expect.anything()
    );

    // Expect cursor update
    expect(mockSupabase.update).toHaveBeenCalledWith({
      sync_cursor: expect.any(Number)
    });
  });
});
