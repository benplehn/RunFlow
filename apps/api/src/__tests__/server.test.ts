import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer } from '../server';
import { loadConfig } from '../config';
import { ensureSupabaseEnv } from './test-utils';

describe('Server Initialization', () => {
  let server: FastifyInstance | null = null;

  // Provide sensible defaults for local/CI runs without a real Supabase env file.
  beforeAll(() => {
    ensureSupabaseEnv();
  });

  afterEach(async () => {
    if (server) {
      await server.close();
      server = null;
    }
  });

  it('creates server successfully with valid config', async () => {
    const config = loadConfig();
    server = await createServer(config);
    expect(server).toBeDefined();
    expect(server.db).toBeDefined();
    expect(server.db.anon).toBeDefined();
    expect(server.db.service).toBeDefined();
  });

  it('registers health routes', async () => {
    const config = loadConfig();
    server = await createServer(config);
    await server.ready();

    const routes = server.printRoutes();
    expect(routes).toContain('health (GET');
    expect(routes).toContain('/db (GET');
  });
});
