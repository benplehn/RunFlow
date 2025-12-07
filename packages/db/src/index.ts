export * from './training';
export {
  createAnonClient,
  createServiceClient,
  createAuthenticatedClient,
  resetClients,
  testConnection,
  type SupabaseClientConfig
} from './client';
export type { Database } from './types';
export type { SupabaseClient, User, Session } from '@supabase/supabase-js';
