import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { container } from "@/lib/container";

/**
 * Monitor de uptime interno — não substitui `/api/health` (continua a
 * única fonte de verdade sobre o estado do sistema, usada por qualquer
 * monitor externo), só adiciona o lado do alerta: roda a mesma
 * verificação e, quando `unhealthy`, dispara um evento no Sentry com
 * severidade `fatal` para que as regras de alerta do projeto (e-mail,
 * Slack, o que for configurado no painel do Sentry) disparem — zero
 * credencial nova no código, reaproveita o Sentry já configurado.
 *
 * Protegido em `src/middleware.ts` (`/api/cron/*`, todo método).
 * Pronto para agendador externo (Vercel Cron, GitHub Actions, serviço
 * de cron) no mesmo padrão de `/api/cron/price-capture` — ver
 * `docs/DEPLOY.md` §5d para o bloco exato a adicionar quando a
 * ativação em produção for decidida. Nenhum agendamento foi ativado
 * nesta sprint.
 */
export async function GET() {
  try {
    const health = await container.health.checkAll();

    if (health.status === "unhealthy") {
      const failing = health.checks.filter((check) => check.status !== "healthy");
      Sentry.captureMessage("Healthcheck unhealthy — uptime monitor", {
        level: "fatal",
        tags: { source: "uptime-check-cron" },
        extra: { checks: failing },
      });
    }

    const statusCode = health.status === "unhealthy" ? 503 : 200;
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    console.error("[api/cron/uptime-check] erro inesperado", error);
    Sentry.captureException(error, { tags: { source: "uptime-check-cron" } });
    return NextResponse.json({ code: "INTERNAL_ERROR", message: "Erro interno" }, { status: 500 });
  }
}
