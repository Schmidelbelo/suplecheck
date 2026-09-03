import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { runPriceCaptureJob } from "@/modules/pricing/pipeline/PriceCaptureJobRunner";

/**
 * Endpoint pronto para agendador externo (Vercel Cron, GitHub Actions
 * ou qualquer serviço de cron) — GET porque é assim que o Vercel Cron
 * chama por padrão. Protegido em `src/middleware.ts` (`x-api-key` ou
 * `Authorization: Bearer <ADMIN_API_KEY>`, formato que o Vercel Cron
 * usa nativamente). Nenhum cron está configurado/ativo — ver
 * `docs/DEPLOY.md` para o passo a passo de ativação manual.
 */
export async function GET() {
  try {
    const summary = await runPriceCaptureJob();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("[api/cron/price-capture] erro inesperado", error);
    Sentry.captureException(error);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: "Erro interno" }, { status: 500 });
  }
}
