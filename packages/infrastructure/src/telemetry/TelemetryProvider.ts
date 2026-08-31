export interface Span {
  end(): void;
  recordError(error: unknown): void;
}

export interface MetricTags {
  readonly [key: string]: string | number | boolean;
}

/**
 * Abstração de observabilidade técnica (spans/métricas de performance) —
 * distinto de `AuditLogPort`/`AnalyticsPort` (Application, eventos de
 * negócio) e de `external-apis/analytics` (GA/Clarity, comportamento de
 * usuário final). Telemetria é "o sistema está saudável e rápido?",
 * não "o que o usuário/admin fez".
 */
export interface TelemetryProvider {
  startSpan(name: string, tags?: MetricTags): Span;
  recordMetric(name: string, value: number, tags?: MetricTags): void;
}
