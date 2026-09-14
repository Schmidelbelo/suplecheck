import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getPriceStatsBySkuIds } from "@/modules/pricing/services/price.service";

/**
 * Evolução de preço (menor/maior já registrado, atual, variação,
 * tendência) de vários SKUs em UMA requisição — consumidores externos
 * da API. `/ofertas` NÃO chama mais esta rota — usa
 * `getPriceStatsBySkuIds` diretamente (ver `offersOverview.ts`).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const skuIds = (searchParams.get("skuIds") ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const result = await getPriceStatsBySkuIds(skuIds);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/monitoring/price-stats] erro inesperado", error);
    Sentry.captureException(error);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: "Erro interno" }, { status: 500 });
  }
}
