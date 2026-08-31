export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  readonly [key: string]: unknown;
}

/**
 * Abstração de log usada por toda a Infrastructure (adapters, providers).
 * Use Cases da Application nunca logam diretamente — se precisarem
 * registrar algo de negócio, isso é `AuditLogPort`/`AnalyticsPort`
 * (Application), não `Logger` (Infrastructure é quem decide ONDE um log
 * vai parar: console, arquivo, um serviço de observabilidade).
 */
export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  /** Retorna um Logger novo que sempre inclui `context` — útil para "todo log deste módulo carrega module: 'billing'". */
  child(context: LogContext): Logger;
}
