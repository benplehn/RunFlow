import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database, SupabaseClientConfig } from './types';

/**
 * Singleton Supabase client instances
 * Pattern: Lazy initialization + singleton pour réutiliser les connexions
 * Raison: Éviter de créer une nouvelle connexion à chaque appel
 */
let anonClientInstance: SupabaseClient<Database> | null = null;
let serviceClientInstance: SupabaseClient<Database> | null = null;

/**
 * Create or return singleton anon client (for client-side patterns)
 *
 * Pattern: Singleton avec validation
 * Usage: Client avec clé anonyme - respecte les politiques RLS
 *
 * @param config - Configuration Supabase (url + anonKey requis)
 * @returns Client Supabase typé
 * @throws Error si la configuration est invalide
 *
 * Note: Ce client est sûr pour une utilisation côté client car il respecte RLS
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
        // Pas de persistance de session côté serveur (stateless)
        persistSession: false
      }
    }
  );

  return anonClientInstance;
}

/**
 * Create or return singleton service client (for backend operations)
 *
 * Pattern: Singleton avec validation + privilèges élevés
 * Usage: Client avec service role key - BYPASS les politiques RLS
 *
 * @param config - Configuration Supabase (url + serviceRoleKey requis)
 * @returns Client Supabase typé avec privilèges admin
 * @throws Error si la configuration est invalide
 *
 * ⚠️ SÉCURITÉ: Ce client ne doit JAMAIS être exposé côté client!
 * Usage approprié: Backend API, workers, scripts admin uniquement
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
        // Backend: pas de sessions ni de refresh tokens
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
 * Pattern: Test utility pour isolation des tests
 * Usage: Appeler dans beforeEach() des tests pour éviter les effets de bord
 *
 * Note: Permet de tester le comportement singleton en créant de nouvelles instances
 */
export function resetClients(): void {
  anonClientInstance = null;
  serviceClientInstance = null;
}

/**
 * Test database connection with simple query
 *
 * Pattern: Health check simple
 * Usage: Vérifier que la connexion DB fonctionne
 *
 * @param client - Client Supabase à tester
 * @returns true si la connexion fonctionne, false sinon
 *
 * Note: Query légère (LIMIT 1) pour minimiser l'impact
 */
export async function testConnection(
  client: SupabaseClient<Database>
): Promise<boolean> {
  try {
    // Requête minimale pour tester la connexion
    const { error } = await client.from('profiles').select('id').limit(1);
    // Pas d'erreur = connexion OK
    return !error;
  } catch {
    // Toute exception = connexion KO
    return false;
  }
}
