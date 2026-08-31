import type { HealthIndicator, HealthCheckResult } from "../HealthCheck";

/**
 * Único indicador real (não stub) hoje: memória do processo Node. Não
 * depende de nenhuma integração externa, então funciona em qualquer
 * ambiente sem configuração — útil como prova de vida do próprio
 * `HealthCheckRegistry` antes de existir qualquer conexão real (banco,
 * cache) para checar.
 */
export class MemoryIndicator implements HealthIndicator {
  readonly name = "process-memory";

  constructor(private readonly maxHeapMb: number = 512) {}

  async check(): Promise<HealthCheckResult> {
    const heapUsedMb = process.memoryUsage().heapUsed / (1024 * 1024);
    const status = heapUsedMb > this.maxHeapMb ? "degraded" : "healthy";

    return {
      name: this.name,
      status,
      message: `heap usado: ${heapUsedMb.toFixed(1)}MB (limite: ${this.maxHeapMb}MB)`,
      checkedAt: new Date(),
    };
  }
}
