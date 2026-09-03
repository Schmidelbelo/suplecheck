import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { priceService, computePriceStats } from "@/modules/pricing/services/price.service";

/**
 * Evolução de preço (menor/maior já registrado, atual, variação,
 * tendência) de vários SKUs em UMA requisição — usado por `/ofertas`
 * para não fazer uma chamada HTTP por produto (era o padrão anterior
 * em `loadCatalogPriceInfo`, N produtos = N requisições). `skuIds` vem
 * como querystring separada por vírgula; SKUs sem nenhuma captura
 * aparecem no resultado com valor `null` — nunca omitidos, para que o
 * chamador saiba mostrar "sem histórico suficiente" em vez de nada.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const skuIds = (searchParams.get("skuIds") ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (skuIds.length === 0) {
      return NextResponse.json({});
    }

    const historyBySku = await priceService.getHistoryBySkuIds(skuIds);

    const result: Record<
      string,
      { stats: ReturnType<typeof computePriceStats>; lastCapturedAt: string | null }
    > = {};
    for (const skuId of skuIds) {
      const points = historyBySku.get(skuId) ?? [];
      result[skuId] = {
        stats: computePriceStats(points),
        lastCapturedAt: points[points.length - 1]?.capturedAt.toISOString() ?? null,
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/monitoring/price-stats] erro inesperado", error);
    Sentry.captureException(error);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: "Erro interno" }, { status: 500 });
  }
}
