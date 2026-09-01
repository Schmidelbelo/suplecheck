import type { PrismaClient } from "@prisma/client";
import type { RankingRepositoryPort, RankingDTO } from "../../application-kernel";

/**
 * Implementação real de `RankingRepositoryPort` sobre Prisma — persiste
 * o snapshot (`Ranking` + `RankingEntry`) gerado por
 * `GenerateRankingUseCase`. `findLatest` é a leitura barata que a página
 * pública consome — nunca recalcula nada (Domain Model §3.4).
 */
export class PrismaRankingRepository implements RankingRepositoryPort {
  constructor(private readonly client: PrismaClient) {}

  async save(ranking: RankingDTO): Promise<void> {
    const [category, methodologyVersion] = await Promise.all([
      this.client.category.findUniqueOrThrow({ where: { slug: ranking.categorySlug } }),
      this.client.methodologyVersion.findFirstOrThrow({
        where: { methodology: { id: ranking.methodologyId }, version: ranking.methodologyVersion },
      }),
    ]);

    await this.client.ranking.create({
      data: {
        categoryId: category.id,
        methodologyVersionId: methodologyVersion.id,
        generatedAt: new Date(ranking.generatedAt),
        entries: {
          create: ranking.entries.map((e) => ({
            productId: e.supplementId,
            position: e.position,
            finalScore: e.finalScore,
            classificationTier: e.classificationTier,
          })),
        },
      },
    });
  }

  async findLatest(categorySlug: string): Promise<RankingDTO | null> {
    const category = await this.client.category.findUnique({ where: { slug: categorySlug } });
    if (!category) return null;

    const ranking = await this.client.ranking.findFirst({
      where: { categoryId: category.id },
      include: {
        entries: { orderBy: { position: "asc" } },
        methodologyVersion: { include: { methodology: true } },
      },
      orderBy: { generatedAt: "desc" },
    });
    if (!ranking) return null;

    return {
      categorySlug,
      methodologyId: ranking.methodologyVersion.methodology.id,
      methodologyVersion: ranking.methodologyVersion.version,
      generatedAt: ranking.generatedAt.toISOString(),
      entries: ranking.entries.map((e) => ({
        position: e.position,
        supplementId: e.productId,
        finalScore: e.finalScore,
        classificationTier: e.classificationTier,
      })),
    };
  }
}
