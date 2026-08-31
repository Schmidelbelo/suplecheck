import type { Logger, LogLevel, LogContext } from "./Logger";

const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

/**
 * Implementação real e funcional (não é stub): escreve em `console.*`,
 * filtrando por nível mínimo configurado. Serve tanto de logger de
 * desenvolvimento quanto de base para qualquer ambiente que colete stdout
 * (a maioria dos PaaS/containers) — não é "provisório", é a
 * implementação padrão até que um provedor de observabilidade dedicado
 * (ver `telemetry/`) seja conectado.
 */
export class ConsoleLogger implements Logger {
  constructor(
    private readonly minLevel: LogLevel = "info",
    private readonly baseContext: LogContext = {},
  ) {}

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }
  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }
  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }
  error(message: string, context?: LogContext): void {
    this.log("error", message, context);
  }

  child(context: LogContext): Logger {
    return new ConsoleLogger(this.minLevel, { ...this.baseContext, ...context });
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (LEVEL_RANK[level] < LEVEL_RANK[this.minLevel]) return;

    const merged = { ...this.baseContext, ...context };
    const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}`;
    const method =
      level === "debug" ? "debug" : level === "warn" ? "warn" : level === "error" ? "error" : "log";

    if (Object.keys(merged).length > 0) {
      // eslint-disable-next-line no-console
      console[method](line, merged);
    } else {
      // eslint-disable-next-line no-console
      console[method](line);
    }
  }
}
