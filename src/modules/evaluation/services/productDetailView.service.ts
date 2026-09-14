import { cache } from "react";
import { container, rankingService } from "@/lib/container";
import { productViewService } from "@/modules/evaluation/services/productView.service";
import type { ProductRankingContext, ProductView } from "@/modules/evaluation/types";

/**
 * Mesma composição de leitura que `/api/evaluation/products/[idOrSlug]/view`
 * expõe por HTTP — extraída para cá para que as páginas públicas
 * (`/creatina/[slug]`, `/categorias/[slug]/[produto]`, `generateMetadata`
 * de ambas, `opengraph-image`) chamem o banco diretamente, sem um
 * fetch HTTP interno para a própria API a cada request (o mesmo produto
 * era buscado 2x — uma vez em `generateMetadata`, outra na página — cada
 * uma com uma chamada de rede real para o próprio deploy). `cache()` do
 * React garante que, dentro de uma mesma renderização de página, as duas
 * chamadas colapsam numa única consulta ao banco.
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

export const loadProductDetailView = cache(
  async (idOrSlug: string): Promise<ProductView | null> => {
    const product = await container.useCases.getSupplement.execute(idOrSlug).catch(() => null);
    if (!product) return null;

    const [score, history, presentation, ranking] = await Promise.all([
      container.useCases.getSupplementScore.execute(product.id).catch(() => null),
      container.useCases.listSupplementScoreHistory.execute(product.id),
      productViewService.loadPresentation(product.id),
      loadRankingContext(product.categorySlug, product.id),
    ]);

    return { product, presentation, score, history, ranking };
  },
);
