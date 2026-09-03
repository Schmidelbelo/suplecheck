import { rankingService, container } from "@/lib/container";
import { productViewService } from "@/modules/evaluation/services/productView.service";
import { calculateOverallScores, assignProductBadges } from "@core/index";
import type { RankingView } from "../types";

/**
 * Leitura combinada (Application + apresentação + Score Geral + selos)
 * de uma categoria — a mesma montagem que `/api/evaluation/rankings/
 * [categorySlug]/view` expõe por HTTP, extraída para cá para que
 * consumidores server-side (páginas de marca, categoria, comparação)
 * chamem diretamente sem um round-trip HTTP desnecessário a si mesmos.
 * A rota HTTP chama esta mesma função — nenhuma lógica duplicada entre
 * as duas.
 */
export async function loadRankingView(categorySlug: string): Promise<RankingView | null> {
  const ranking = await rankingService.get({ categorySlug }).catch(() => null);
  if (!ranking) return null;

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
  const overallResultByProduct = new Map(overallScores.map((r) => [r.productId, r]));

  const badgesByProduct = assignProductBadges(
    validEntries.map(({ entry, product }) => ({
      productId: entry.supplementId,
      priceCents: product.price?.cents ?? null,
      finalScore: entry.finalScore,
      overallScore: overallResultByProduct.get(entry.supplementId)?.overallScore ?? entry.finalScore,
      criteriaScores: breakdownByProduct.get(entry.supplementId) ?? {},
    })),
  );

  return {
    categorySlug: ranking.categorySlug,
    methodologyId: ranking.methodologyId,
    methodologyVersion: ranking.methodologyVersion,
    generatedAt: ranking.generatedAt,
    entries: validEntries.map(({ entry, product }) => {
      const overallResult = overallResultByProduct.get(entry.supplementId);
      return {
        position: entry.position,
        finalScore: entry.finalScore,
        classificationTier: entry.classificationTier,
        product,
        overallScore: overallResult?.overallScore ?? entry.finalScore,
        scoreComponents: overallResult?.components ?? {
          quality: entry.finalScore,
          price: null,
          pricePerDose: null,
          pricePerGram: null,
        },
        badges: badgesByProduct.get(entry.supplementId) ?? [],
        criteriaScores: breakdownByProduct.get(entry.supplementId) ?? {},
      };
    }),
  };
}
