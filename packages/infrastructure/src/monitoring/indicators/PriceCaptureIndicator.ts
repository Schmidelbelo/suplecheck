import type { PrismaClient } from "@prisma/client";
import type { HealthIndicator, HealthCheckResult } from "../HealthCheck";

const JOB_SOURCE = "price-capture-job";
/** Sem execução bem-sucedida dentro desta janela, o indicador vira `degraded` — sinal de que o cron parou de rodar. */
const STALE_AFTER_MS = 26 * 60 * 60 * 1000; // 26h — folga sobre um cron diário

/**
 * Reporta a saúde da captura automática de preço: quando rodou pela
 * última vez, quantos SKUs monitora, quando foi a última falha. Não
 * lança se nunca tiver rodado ainda — `degraded` com mensagem
 * explicativa, nunca `unhealthy` só por ainda não ter sido configurado
 * (diferente de banco fora do ar, ausência de cron não é uma emergência).
 */
export class PriceCaptureIndicator implements HealthIndicator {
  readonly name = "price-capture";

  constructor(private readonly client: PrismaClient) {}

  async check(): Promise<HealthCheckResult> {
    const [lastRun, lastFailure, monitoredCount] = await Promise.all([
      this.client.importBatch.findFirst({
        where: { source: JOB_SOURCE },
        orderBy: { startedAt: "desc" },
      }),
      this.client.importBatch.findFirst({
        where: { source: JOB_SOURCE, status: { in: ["FAILED", "COMPLETED_WITH_ERRORS"] } },
        orderBy: { startedAt: "desc" },
      }),
      this.client.sku.count({ where: { status: "ACTIVE" } }),
    ]);

    if (!lastRun) {
      return {
        name: this.name,
        status: "degraded",
        message: "Captura de preço nunca foi executada ainda.",
        checkedAt: new Date(),
      };
    }

    const ageMs = Date.now() - lastRun.startedAt.getTime();
    const stale = ageMs > STALE_AFTER_MS;

    return {
      name: this.name,
      status: stale ? "degraded" : "healthy",
      message: stale
        ? "Última execução foi há mais de 26h — verifique se o cron ainda está ativo."
        : undefined,
      details: {
        lastRunAt: lastRun.startedAt.toISOString(),
        lastRunStatus: lastRun.status,
        productsMonitored: monitoredCount,
        lastFailureAt: lastFailure?.startedAt.toISOString() ?? null,
      },
      checkedAt: new Date(),
    };
  }
}
