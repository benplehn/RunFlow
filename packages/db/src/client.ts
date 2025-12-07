import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export interface SupabaseClientConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey?: string;
}

/**
 * Singleton Supabase client instances
 * Pattern: Lazy initialization + Singleton for connection reuse.
 * Reason: To avoid creating a new connection for every request or operation.
 */
let anonClientInstance: SupabaseClient<Database> | null = null;
let serviceClientInstance: SupabaseClient<Database> | null = null;

/**
 * Create or return singleton anon client (for client-side patterns)
 *
 * Pattern: Singleton with Validation
 * Usage: Client with Anonymous Key - respects RLS policies.
 *
 * @param config - Supabase Configuration (Url + AnonKey required)
 * @returns Typed Supabase Client
 * @throws Error if configuration is invalid
 *
 * Note: This client is safe for client-side usage as it respects RLS.
 */
export function createAnonClient(
  config: SupabaseClientConfig
): SupabaseClient<Database> {
  // Early return pattern: Si le client existe déjà, on le retourne
  if (anonClientInstance) {
    return anonClientInstance;
  }

  // Guard clause: Validation des paramètres requis
  // Fail fast pattern: On échoue immédiatement si la config est invalide
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error(
      'Missing required Supabase configuration: supabaseUrl and supabaseAnonKey'
    );
  }

  // Lazy initialization: Création du client seulement si nécessaire
  anonClientInstance = createClient<Database>(
    config.supabaseUrl,
    config.supabaseAnonKey,
    {
      auth: {
        // No server-side session persistence (stateless)
        persistSession: false
      }
    }
  );

  return anonClientInstance;
}

/**
 * Create or return singleton service client (for backend operations)
 *
 * Pattern: Singleton with Validation + High Privileges
 * Usage: Client with Service Role Key - BYPASSES RLS policies.
 *
 * @param config - Configuration Supabase (url + serviceRoleKey requis)
 * @returns Typed Supabase Client with Admin privileges
 * @throws Error if configuration is invalid
 *
 * ⚠️ SECURITY: This client must NEVER be exposed to the client side!
 * Usage: Backend API, Workers, or Admin Scripts only.
 */
export function createServiceClient(
  config: SupabaseClientConfig
): SupabaseClient<Database> {
  // Early return pattern
  if (serviceClientInstance) {
    return serviceClientInstance;
  }

  // Guard clause: Validation stricte pour le service client
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error(
      'Missing required Supabase configuration: supabaseUrl and supabaseServiceRoleKey'
    );
  }

  // Lazy initialization avec config backend optimisée
  serviceClientInstance = createClient<Database>(
    config.supabaseUrl,
    config.supabaseServiceRoleKey,
    {
      auth: {
        // Backend: no sessions or refresh tokens needed
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );

  return serviceClientInstance;
}

/**
 * Reset client instances (useful for testing)
 *
 * Pattern: Test Utility for Isolation
 * Usage: Call in beforeEach() to avoid side effects between tests.
 *
 * Note: Allows testing the singleton behavior by forcing fresh instances.
 */
export function resetClients(): void {
  anonClientInstance = null;
  serviceClientInstance = null;
}

/**
 * Test database connection with simple query
 *
 * Pattern: Simple Health Check
 * Usage: Verify that the DB connection is active.
 *
 * @param client - Supabase Client to test
 * @returns true if connection works, false otherwise
 *
 * Note: Minimal query (LIMIT 1) to minimize impact.
 */
export async function testConnection(
  client: SupabaseClient<Database>
): Promise<boolean> {
  try {
    // Minimal query to test connection
    const { error } = await client.from('profiles').select('id').limit(1);
    // No error = connection OK
    return !error;
  } catch {
    // Any exception = connection failed
    return false;
  }
}

/**
 * Create a client authenticated as a specific user
 *
 * Pattern: Per-request client context
 * Usage: Pass the JWT from the API request to forward auth context to Supabase
 *
 * @param config - Base config
 * @param token - JWT Access Token (without Bearer prefix usually, but Supabase handles it)
 */
export function createAuthenticatedClient(
  config: SupabaseClientConfig,
  token: string
): SupabaseClient<Database> {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key required');
  }

  return createClient<Database>(config.supabaseUrl, config.supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      persistSession: false
    }
  });
}
