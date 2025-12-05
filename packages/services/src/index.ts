export type IntegrationProvider = 'strava' | 'garmin' | 'webhook';

export function registerServicePlaceholder(provider: IntegrationProvider): string {
  return `Placeholder registration for ${provider} integration.`;
}
