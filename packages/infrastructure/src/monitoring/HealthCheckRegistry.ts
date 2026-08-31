import type { HealthIndicator, AggregatedHealth, HealthStatus } from "./HealthCheck";

const WORST_FIRST: HealthStatus[] = ["unhealthy", "degraded", "healthy"];

/**
 * Agrega quantos `HealthIndicator` a Infrastructure quiser registrar
 * (memória do processo, conectividade de banco quando existir,
 * conectividade de cache/storage quando existirem) em um único
 * `/health`-like resultado. Nenhum indicador é obrigatório — um
 * registro vazio é "saudável" por vacuidade (nada para reportar como
 * quebrado).
 */
export class HealthCheckRegistry {
  private readonly indicators: HealthIndicator[] = [];

  register(indicator: HealthIndicator): void {
    this.indicators.push(indicator);
  }

  async checkAll(): Promise<AggregatedHealth> {
    const checks = await Promise.all(this.indicators.map((indicator) => indicator.check()));
    const status =
      WORST_FIRST.find((candidate) => checks.some((c) => c.status === candidate)) ?? "healthy";

    return { status, checks, checkedAt: new Date() };
  }
}
