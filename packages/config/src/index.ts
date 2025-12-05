export interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export function buildConfig(env: Partial<EnvConfig>): EnvConfig {
  return {
    supabaseUrl: env.supabaseUrl ?? 'https://example.supabase.co',
    supabaseAnonKey: env.supabaseAnonKey ?? 'supabase-anon-key'
  };
}
