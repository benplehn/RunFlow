import type { SupabaseClient, User } from '@runflow/db';

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  details?: string;
}

export interface DbHealthResponse extends HealthResponse {
  database?: {
    connected: boolean;
  };
}

// Extend Fastify instance with our custom properties
declare module 'fastify' {
  interface FastifyInstance {
    db: {
      anon: SupabaseClient;
      service: SupabaseClient;
    };
  }

  interface FastifyRequest {
    user?: User | null;
  }
}
