import { NextResponse } from "next/server";
import { container, rankingService } from "@/lib/container";
import { handleApiError } from "@/lib/api/handleApiError";
import { productViewService } from "@/modules/evaluation/services/productView.service";
import type { ProductRankingContext } from "@/modules/evaluation/types";

type Params = { params: Promise<{ idOrSlug: string }> };

/**
 * Onde este produto está no ranking vigente da sua categoria. Lê o
 * mesmo snapshot que `/api/evaluation/rankings/[categorySlug]` já expõe
 * — nenhum Port/Use Case novo, só uma composição de leitura a mais
 * neste read model, igual ao que `productViewService` já faz para
 * preço/loja/imagem. `null` quando ainda não existe ranking gerado para
 * a categoria (nunca um erro: a página de produto funciona sem isso).
 */
async function loadRankingContext(
  categorySlug: string,
  productId: string,
): Promise<ProductRankingContext | null> {
  const ranking = await rankingService.get({ categorySlug }).catch(() => null);
  if (!ranking) return null;

  const position = ranking.entries.findIndex((entry) => entry.supplementId === productId);
  if (position === -1) return null;

  return {
    position: position + 1,
    total: ranking.entries.length,
    categorySlug,
    generatedAt: ranking.generatedAt,
  };
}

/**
 * Leitura combinada para a página pública de detalhes do produto: score
 * atual + histórico de avaliações (Application) + apresentação (marca,
 * SKU, preço, loja, imagem) + posição no ranking vigente. `score`/
 * `history`/`ranking` vêm vazios (não 404) quando o produto ainda não
 * foi avaliado ou não está em nenhum ranking gerado — a página de
 * detalhes deve continuar funcionando mesmo sem esses dados.
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { idOrSlug } = await params;
    const product = await container.useCases.getSupplement.execute(idOrSlug);

    const [score, history, presentation, ranking] = await Promise.all([
      container.useCases.getSupplementScore.execute(product.id).catch(() => null),
      container.useCases.listSupplementScoreHistory.execute(product.id),
      productViewService.loadPresentation(product.id),
      loadRankingContext(product.categorySlug, product.id),
    ]);

    return NextResponse.json({ product, presentation, score, history, ranking });
  } catch (error) {
    return handleApiError(error);
  }
}
