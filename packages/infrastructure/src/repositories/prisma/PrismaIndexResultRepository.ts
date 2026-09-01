import type { Prisma, PrismaClient } from "@prisma/client";
import type { IndexResultRepositoryPort, IndexResultDTO } from "../../application-kernel";

type ProductScoreRow = Prisma.ProductScoreGetPayload<{
  include: {
    breakdown: true;
    category: true;
    methodologyVersion: { include: { methodology: true } };
  };
}>;

const include = {
  breakdown: true,
  category: true,
  methodologyVersion: { include: { methodology: true } },
} as const;

function toDTO(row: ProductScoreRow): IndexResultDTO {
  return {
    supplementId: row.productId,
    categorySlug: row.category.slug,
    methodologyId: row.methodologyVersion.methodology.id,
    methodologyVersion: row.methodologyVersion.version,
    finalScore: row.finalScore,
    classificationTier: row.classificationTier,
    classificationLabel: row.classificationLabel,
    breakdown: row.breakdown.map((b) => ({
      criterionId: b.criterionId,
      score: b.score,
      weight: b.weight,
      notes: Array.isArray(b.notes)
        ? (b.notes as unknown as IndexResultDTO["breakdown"][number]["notes"])
        : [],
      flags: Array.isArray(b.flags)
        ? (b.flags as unknown as IndexResultDTO["breakdown"][number]["flags"])
        : [],
    })),
    calculatedAt: row.calculatedAt.toISOString(),
  };
}

/**
 * Implementação real de `IndexResultRepositoryPort` sobre Prisma —
 * `ProductScore` + `ProductScoreCriterionBreakdown` (Domain Model §3.3).
 * Append-only por definição do schema: `save()` sempre é um `create`,
 * nunca um `update` — reavaliar gera uma linha nova, a anterior nunca é
 * tocada (Data Pipeline §4.5), o que é o que dá o histórico "de graça".
 */
export class PrismaIndexResultRepository implements IndexResultRepositoryPort {
  constructor(private readonly client: PrismaClient) {}

  async save(result: IndexResultDTO): Promise<void> {
    const [category, methodologyVersion] = await Promise.all([
      this.client.category.findUniqueOrThrow({ where: { slug: result.categorySlug } }),
      this.client.methodologyVersion.findFirstOrThrow({
        where: { methodology: { id: result.methodologyId }, version: result.methodologyVersion },
      }),
    ]);

    await this.client.productScore.create({
      data: {
        productId: result.supplementId,
        categoryId: category.id,
        methodologyVersionId: methodologyVersion.id,
        finalScore: result.finalScore,
        classificationTier: result.classificationTier,
        classificationLabel: result.classificationLabel,
        calculatedAt: new Date(result.calculatedAt),
        breakdown: {
          create: result.breakdown.map((b) => ({
            criterionId: b.criterionId,
            score: b.score,
            weight: b.weight,
            notes: [...b.notes] as object,
            flags: [...b.flags] as object,
          })),
        },
      },
    });
  }

  async findLatest(supplementId: string): Promise<IndexResultDTO | null> {
    const row = await this.client.productScore.findFirst({
      where: { productId: supplementId },
      include,
      orderBy: { calculatedAt: "desc" },
    });
    return row ? toDTO(row) : null;
  }

  async listHistory(supplementId: string): Promise<IndexResultDTO[]> {
    const rows = await this.client.productScore.findMany({
      where: { productId: supplementId },
      include,
      orderBy: { calculatedAt: "desc" },
    });
    return rows.map(toDTO);
  }

  async listLatestByCategory(categorySlug: string): Promise<IndexResultDTO[]> {
    const category = await this.client.category.findUnique({ where: { slug: categorySlug } });
    if (!category) return [];

    const rows = await this.client.productScore.findMany({
      where: { categoryId: category.id },
      include,
      orderBy: { calculatedAt: "desc" },
    });

    const latestByProduct = new Map<string, ProductScoreRow>();
    for (const row of rows) {
      if (!latestByProduct.has(row.productId)) latestByProduct.set(row.productId, row);
    }
    return [...latestByProduct.values()].map(toDTO);
  }
}
