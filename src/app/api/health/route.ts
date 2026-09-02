import { NextResponse } from "next/server";
import { container } from "@/lib/container";

/**
 * Health check real — agrega os `HealthIndicator` registrados no
 * container (memória do processo + conectividade real com o Postgres
 * via `SELECT 1`, ver `DatabaseIndicator`). `unhealthy` retorna 503 para
 * que monitores externos (UptimeRobot, Vercel, um load balancer) o
 * tratem como indisponibilidade real, não como 200 mascarando falha.
 */
export async function GET() {
  const health = await container.health.checkAll();
  const statusCode = health.status === "unhealthy" ? 503 : 200;

  return NextResponse.json(health, { status: statusCode });
}
