export interface DatabaseClientConfig {
  url: string;
  serviceRoleKey?: string;
}

export function createDbPlaceholder(config: DatabaseClientConfig): string {
  const keyStatus = config.serviceRoleKey
    ? 'with service role key'
    : 'without service role key';
  return `Connect to Supabase at ${config.url} ${keyStatus}.`;
}
