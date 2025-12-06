import dotenv from 'dotenv';
import { join } from 'path';

/**
 * Configuration Module - Chargement et validation des variables d'environnement
 *
 * Pattern: Configuration centralisée + Fail-fast
 * Raison: Détecter les erreurs de config au démarrage, pas au runtime
 */

// Chargement du .env.local depuis la racine du monorepo
// Note: Chemin relatif depuis dist/config.js (3 niveaux au-dessus)
dotenv.config({ path: join(__dirname, '../../../.env.local') });

/**
 * Configuration typée de l'API
 *
 * Pattern: Interface stricte pour type-safety
 * Avantage: Autocomplete + vérification à la compilation
 */
export interface ApiConfig {
  port: number;
  nodeEnv: string;
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  logging: {
    level: string;
    pretty: boolean; // Pretty print en dev, JSON en prod
  };
}

/**
 * Load configuration from environment variables
 *
 * Pattern: Factory avec defaults intelligents
 * Comportement: Valeurs par défaut pour le développement
 *
 * @returns Configuration complète de l'API
 *
 * Note: Ne valide PAS la config - utiliser validateConfig() séparément
 * Raison: Séparation des responsabilités (load vs validate)
 */
export function loadConfig(): ApiConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';

  return {
    // Port par défaut: 4000 (configurable via PORT env var)
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv,
    supabase: {
      // Valeurs vides si non définies (seront validées après)
      url: process.env.SUPABASE_URL || '',
      anonKey: process.env.SUPABASE_ANON_KEY || '',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
    logging: {
      // Dev: debug, Prod: info (sauf override via LOG_LEVEL)
      level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
      // Pretty print en dev pour lisibilité, JSON en prod pour parsing
      pretty: !isProd,
    },
  };
}

/**
 * Validate configuration and throw if invalid
 *
 * Pattern: Fail-fast validation avec messages clairs
 * Usage: Appeler au démarrage de l'app, avant d'initialiser quoi que ce soit
 *
 * @param config - Configuration à valider
 * @throws Error avec détails si la validation échoue
 *
 * Raison: Mieux vaut crasher au démarrage qu'avoir des bugs silencieux en prod
 */
export function validateConfig(config: ApiConfig): void {
  const errors: string[] = [];

  // Validation Supabase: toutes les clés sont requises
  if (!config.supabase.url) {
    errors.push('SUPABASE_URL is required');
  }
  if (!config.supabase.anonKey) {
    errors.push('SUPABASE_ANON_KEY is required');
  }
  if (!config.supabase.serviceRoleKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is required');
  }

  // Pattern: Accumuler toutes les erreurs avant de throw
  // Raison: Afficher tous les problèmes en une fois (meilleure UX dev)
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}
