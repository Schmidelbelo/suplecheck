import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { runPriceCaptureJob } from "@/modules/pricing/pipeline/PriceCaptureJobRunner";

/**
 * Dispara o job de captura de preço manualmente — usado pelo dashboard
 * `/admin/jobs` (botão "Rodar agora"). Protegido em `src/middleware.ts`.
 * Execução síncrona: catálogo pequeno hoje (dezenas de produtos), sem
 * necessidade de fila/worker assíncrono ainda.
 */
export async function POST() {
  try {
    const summary = await runPriceCaptureJob();
    return NextResponse.json(summary, { status: 201 });
  } catch (error) {
    console.error("[api/admin/jobs/price-capture] erro inesperado", error);
    Sentry.captureException(error);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: "Erro interno" }, { status: 500 });
  }
}
