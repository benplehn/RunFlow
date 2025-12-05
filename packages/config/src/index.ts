export interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export function buildConfig(env: Partial<EnvConfig>): EnvConfig {
  // Defaults are placeholders to keep library consumers from crashing in tests or storybooks.
  // Runtime environments (API/worker) should override them via real environment variables.
  return {
    supabaseUrl: env.supabaseUrl ?? 'https://example.supabase.co',
    supabaseAnonKey: env.supabaseAnonKey ?? 'supabase-anon-key'
  };
}
