export interface TelemetryEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
}

export function logPlaceholderEvent(event: TelemetryEvent): string {
  const properties = event.properties ? JSON.stringify(event.properties) : 'no properties';
  return `Telemetry event: ${event.name} (${properties})`;
}
