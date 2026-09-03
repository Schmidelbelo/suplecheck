export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export interface HealthCheckResult {
  readonly name: string;
  readonly status: HealthStatus;
  readonly message?: string;
  /** Dados estruturados opcionais do indicador (ex.: última execução, contadores) — evita achatar tudo em `message`. */
  readonly details?: Record<string, unknown>;
  readonly checkedAt: Date;
}

/** Uma verificação individual (ex: "banco alcançável", "cache alcançável"). Cada Provider/adapter real pode oferecer o seu. */
export interface HealthIndicator {
  readonly name: string;
  check(): Promise<HealthCheckResult>;
}

export interface AggregatedHealth {
  readonly status: HealthStatus;
  readonly checks: readonly HealthCheckResult[];
  readonly checkedAt: Date;
}
