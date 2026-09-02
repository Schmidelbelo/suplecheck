import type { HealthIndicator, HealthCheckResult } from "../HealthCheck";
import type { PrismaConnection } from "../../persistence/prisma/PrismaConnection";

/**
 * Verifica conectividade real com o Postgres via `PrismaConnection.isHealthy()`
 * (`SELECT 1`). Sem isto, `/api/health` não detecta o banco fora do ar —
 * cenário real e recorrente neste projeto (Neon free tier suspende o
 * compute por inatividade).
 */
export class DatabaseIndicator implements HealthIndicator {
  readonly name = "database";

  constructor(private readonly connection: PrismaConnection) {}

  async check(): Promise<HealthCheckResult> {
    const healthy = await this.connection.isHealthy();

    return {
      name: this.name,
      status: healthy ? "healthy" : "unhealthy",
      message: healthy ? undefined : "Não foi possível conectar ao banco de dados.",
      checkedAt: new Date(),
    };
  }
}
