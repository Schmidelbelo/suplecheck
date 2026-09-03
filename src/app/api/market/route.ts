import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handleApiError";
import {
  getMarketOverview,
  getCategoryMarketView,
} from "@/modules/market/services/marketData.service";

/**
 * Inteligência de Mercado — panorama do catálogo inteiro (estatísticas
 * gerais, ranking de marcas) e, opcionalmente via `?categorySlug=`,
 * estatísticas e insights de uma categoria específica (a mesma base que
 * `/creatina` usa para sua seção "Estatísticas da categoria"). Tudo
 * derivado em tempo real do banco (via `marketData.service`, com cache
 * de 5 minutos na consulta agregada) — nenhum número fixo.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("categorySlug");

    const overview = await getMarketOverview();
    if (!overview) {
      return NextResponse.json(
        { code: "MARKET_EMPTY", message: "Nenhum produto avaliado no catálogo ainda." },
        { status: 404 },
      );
    }

    const category = categorySlug ? await getCategoryMarketView(categorySlug) : null;

    return NextResponse.json({
      generatedAt: overview.generatedAt,
      statistics: overview.statistics,
      brandRanking: overview.brandRanking,
      insights: overview.insights,
      category,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
