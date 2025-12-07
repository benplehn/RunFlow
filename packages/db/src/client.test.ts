import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAnonClient, createServiceClient, resetClients } from './client';
import type { SupabaseClientConfig } from './client';

// Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
    auth: {}
  }))
}));

const validConfig: SupabaseClientConfig = {
  supabaseUrl: 'https://test.supabase.co',
  supabaseAnonKey: 'anon-key',
  supabaseServiceRoleKey: 'service-key'
};

describe('createAnonClient', () => {
  beforeEach(() => {
    resetClients();
    vi.clearAllMocks();
  });

  it('creates anon client with valid config', () => {
    const client = createAnonClient(validConfig);
    expect(client).toBeDefined();
  });

  it('returns singleton instance on subsequent calls', () => {
    const client1 = createAnonClient(validConfig);
    const client2 = createAnonClient(validConfig);
    expect(client1).toBe(client2);
  });

  it('throws when missing supabaseUrl', () => {
    expect(() =>
      createAnonClient({ supabaseUrl: '', supabaseAnonKey: 'key' })
    ).toThrow(/Missing required Supabase configuration/);
  });

  it('throws when missing supabaseAnonKey', () => {
    expect(() =>
      createAnonClient({
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: ''
      })
    ).toThrow(/Missing required Supabase configuration/);
  });
});

describe('createServiceClient', () => {
  beforeEach(() => {
    resetClients();
    vi.clearAllMocks();
  });

  it('creates service client with valid config', () => {
    const client = createServiceClient(validConfig);
    expect(client).toBeDefined();
  });

  it('returns singleton instance on subsequent calls', () => {
    const client1 = createServiceClient(validConfig);
    const client2 = createServiceClient(validConfig);
    expect(client1).toBe(client2);
  });

  it('throws when missing supabaseServiceRoleKey', () => {
    expect(() =>
      createServiceClient({
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'anon'
      })
    ).toThrow(/Missing required Supabase configuration/);
  });
});

describe('resetClients', () => {
  it('resets singleton instances', () => {
    const client1 = createAnonClient(validConfig);
    resetClients();
    const client2 = createAnonClient(validConfig);
    expect(client1).not.toBe(client2);
  });
});
