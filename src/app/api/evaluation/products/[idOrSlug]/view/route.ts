import { NextResponse } from "next/server";
import { container } from "@/lib/container";
import { handleApiError } from "@/lib/api/handleApiError";
import { productViewService } from "@/modules/evaluation/services/productView.service";

type Params = { params: Promise<{ idOrSlug: string }> };

/**
 * Leitura combinada para a página pública de detalhes do produto: score
 * atual + histórico de avaliações (Application) + apresentação (marca,
 * SKU, preço, loja, imagem). `score`/`scoreHistory` vêm vazios (não 404)
 * quando o produto ainda não foi avaliado — a página de detalhes deve
 * continuar funcionando mesmo sem nota ainda.
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { idOrSlug } = await params;
    const product = await container.useCases.getSupplement.execute(idOrSlug);

    const [score, history, presentation] = await Promise.all([
      container.useCases.getSupplementScore.execute(product.id).catch(() => null),
      container.useCases.listSupplementScoreHistory.execute(product.id),
      productViewService.loadPresentation(product.id),
    ]);

    return NextResponse.json({ product, presentation, score, history });
  } catch (error) {
    return handleApiError(error);
  }
}
