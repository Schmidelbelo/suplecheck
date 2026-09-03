import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handleApiError";
import { loadRankingView } from "@/modules/evaluation/services/rankingView.service";

type Params = { params: Promise<{ categorySlug: string }> };

/**
 * Leitura combinada para a página pública `/creatina`: ranking (Application)
 * + apresentação de cada produto (marca, SKU, preço, preço por dose,
 * loja, imagem) + Score Geral e selos automáticos (Core Domain). É o
 * único endpoint que essa página (e `/ofertas`, `/creatina/[slug]`)
 * consome — nunca dados mockados (ver ARCHITECTURE.md §3). Score Geral
 * e selos são calculados aqui, UMA vez por requisição, para todo o
 * conjunto comparável — nenhum componente React recalcula nada disso
 * (ver docs/SCORING.md). A montagem em si vive em
 * `rankingView.service.ts`, reaproveitada também por páginas
 * server-side que precisam do mesmo dado sem um round-trip HTTP
 * (marca, categoria, comparação).
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { categorySlug } = await params;
    const view = await loadRankingView(categorySlug);
    if (!view) {
      return NextResponse.json(
        { code: "RANKING_NOT_FOUND", message: "Ranking não encontrado para esta categoria." },
        { status: 404 },
      );
    }
    return NextResponse.json(view);
  } catch (error) {
    return handleApiError(error);
  }
}
