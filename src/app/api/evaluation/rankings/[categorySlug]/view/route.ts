import { NextResponse } from "next/server";
import { rankingService, container } from "@/lib/container";
import { handleApiError } from "@/lib/api/handleApiError";
import { productViewService } from "@/modules/evaluation/services/productView.service";
import { calculateOverallScores, assignProductBadges } from "@core/index";

type Params = { params: Promise<{ categorySlug: string }> };

/**
 * Leitura combinada para a página pública `/creatina`: ranking (Application)
 * + apresentação de cada produto (marca, SKU, preço, preço por dose,
 * loja, imagem) + Score Geral e selos automáticos (Core Domain). É o
 * único endpoint que essa página (e `/ofertas`, `/creatina/[slug]`)
 * consome — nunca dados mockados (ver ARCHITECTURE.md §3). Score Geral
 * e selos são calculados aqui, UMA vez por requisição, para todo o
 * conjunto comparável — nenhum componente React recalcula nada disso
 * (ver docs/SCORING.md).
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { categorySlug } = await params;
    const ranking = await rankingService.get({ categorySlug });
    const supplementIds = ranking.entries.map((entry) => entry.supplementId);

    const [presentations, indexResults] = await Promise.all([
      productViewService.loadPresentations(supplementIds),
      container.ports.indexResults.listLatestByCategory(categorySlug),
    ]);

    const breakdownByProduct = new Map(
      indexResults.map((result) => [
        result.supplementId,
        Object.fromEntries(result.breakdown.map((b) => [b.criterionId, b.score])),
      ]),
    );

    const validEntries = ranking.entries
      .map((entry) => {
        const product = presentations.get(entry.supplementId);
        return product ? { entry, product } : null;
      })
      .filter(
        (
          v,
        ): v is {
          entry: (typeof ranking.entries)[number];
          product: NonNullable<ReturnType<typeof presentations.get>>;
        } => v !== null,
      );

    const overallScores = calculateOverallScores(
      validEntries.map(({ entry, product }) => ({
        productId: entry.supplementId,
        qualityScore: entry.finalScore,
        priceCents: product.price?.cents ?? null,
        pricePerDoseCents: product.price?.pricePerDoseCents ?? null,
        pricePerGramCents: product.price?.pricePerGramCents ?? null,
      })),
    );
    const overallScoreByProduct = new Map(overallScores.map((r) => [r.productId, r.overallScore]));

    const badgesByProduct = assignProductBadges(
      validEntries.map(({ entry, product }) => ({
        productId: entry.supplementId,
        priceCents: product.price?.cents ?? null,
        finalScore: entry.finalScore,
        overallScore: overallScoreByProduct.get(entry.supplementId) ?? entry.finalScore,
        criteriaScores: breakdownByProduct.get(entry.supplementId) ?? {},
      })),
    );

    return NextResponse.json({
      categorySlug: ranking.categorySlug,
      methodologyId: ranking.methodologyId,
      methodologyVersion: ranking.methodologyVersion,
      generatedAt: ranking.generatedAt,
      entries: validEntries.map(({ entry, product }) => ({
        position: entry.position,
        finalScore: entry.finalScore,
        classificationTier: entry.classificationTier,
        product,
        overallScore: overallScoreByProduct.get(entry.supplementId) ?? entry.finalScore,
        badges: badgesByProduct.get(entry.supplementId) ?? [],
        criteriaScores: breakdownByProduct.get(entry.supplementId) ?? {},
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
