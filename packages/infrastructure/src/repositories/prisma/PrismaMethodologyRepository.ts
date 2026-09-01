import type { Prisma, PrismaClient } from "@prisma/client";
import type { MethodologyRepositoryPort, MethodologyDTO } from "../../application-kernel";

type MethodologyVersionRow = Prisma.MethodologyVersionGetPayload<{
  include: {
    methodology: true;
    criteria: true;
    classificationBands: true;
    categoryOverrides: { include: { category: true } };
  };
}>;

const include = {
  methodology: true,
  criteria: true,
  classificationBands: true,
  categoryOverrides: { include: { category: true } },
} as const;

function toDTO(row: MethodologyVersionRow): MethodologyDTO {
  return {
    id: row.methodology.id,
    name: row.methodology.name,
    version: row.version,
    aggregationStrategyName: row.aggregationStrategy,
    assignments: row.criteria.map((c) => ({
      criterionId: c.criterionId,
      weight: c.weight,
      enabled: c.enabled,
    })),
    classification: row.classificationBands.map((b) => ({
      tier: b.tier,
      minScore: b.minScore,
      label: b.label,
      description: b.description,
    })),
    categoryOverrides: row.categoryOverrides.map((o) => ({
      categorySlug: o.category.slug,
      disabledCriteria: Array.isArray(o.disabledCriterionIds)
        ? (o.disabledCriterionIds as string[])
        : [],
      weightOverrides: (o.weightOverrides as Record<string, number>) ?? {},
    })),
  };
}

/**
 * Implementação real de `MethodologyRepositoryPort` sobre Prisma.
 * `MethodologyDTO.id` é `Methodology.id` (a identidade estável de
 * negócio, ex. "creatina-methodology") — cada `save()` cria uma
 * `MethodologyVersion` NOVA (nunca sobrescreve uma existente, ver
 * `ReviseMethodologyUseCase`); `findById` retorna a versão mais recente
 * dessa metodologia, mesma convenção do adapter in-memory que este
 * substitui.
 *
 * `Methodology.categoryId` começa nulo (a Application não sabe a
 * categoria no momento de `save()` — só `setActiveForCategory` sabe) e é
 * preenchido na primeira ativação.
 */
export class PrismaMethodologyRepository implements MethodologyRepositoryPort {
  constructor(private readonly client: PrismaClient) {}

  async findById(id: string): Promise<MethodologyDTO | null> {
    const row = await this.client.methodologyVersion.findFirst({
      where: { methodology: { id } },
      include,
      orderBy: { createdAt: "desc" },
    });
    return row ? toDTO(row) : null;
  }

  async findActiveForCategory(categorySlug: string): Promise<MethodologyDTO | null> {
    const category = await this.client.category.findUnique({ where: { slug: categorySlug } });
    if (!category) return null;

    const active = await this.client.categoryActiveMethodology.findUnique({
      where: { categoryId: category.id },
      include: { methodologyVersion: { include } },
    });
    return active ? toDTO(active.methodologyVersion) : null;
  }

  async listVersions(methodologyId: string): Promise<MethodologyDTO[]> {
    const rows = await this.client.methodologyVersion.findMany({
      where: { methodology: { id: methodologyId } },
      include,
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toDTO);
  }

  async save(methodology: MethodologyDTO): Promise<void> {
    // `MethodologyVersionCriterion.criterionId` tem FK para `Criterion` —
    // uma metodologia pode ser criada antes de qualquer avaliação já ter
    // rodado `PrismaCriterionCatalogAdapter.loadRegistry()` (que é quem
    // normalmente garante essas linhas). `update: {}` nunca sobrescreve um
    // critério que já exista de verdade — só evita a violação de FK.
    for (const assignment of methodology.assignments) {
      await this.client.criterion.upsert({
        where: { id: assignment.criterionId },
        create: { id: assignment.criterionId, name: assignment.criterionId, description: "" },
        update: {},
      });
    }

    await this.client.methodology.upsert({
      where: { id: methodology.id },
      create: { id: methodology.id, name: methodology.name, categoryId: null },
      update: { name: methodology.name },
    });

    const version = await this.client.methodologyVersion.create({
      data: {
        methodologyId: methodology.id,
        version: methodology.version,
        aggregationStrategy: methodology.aggregationStrategyName,
        status: "PUBLISHED",
        publishedAt: new Date(),
        criteria: {
          create: methodology.assignments.map((a) => ({
            criterionId: a.criterionId,
            weight: a.weight,
            enabled: a.enabled,
          })),
        },
        classificationBands: {
          create: methodology.classification.map((b) => ({
            tier: b.tier,
            minScore: b.minScore,
            label: b.label,
            description: b.description,
          })),
        },
      },
    });

    for (const override of methodology.categoryOverrides) {
      const category = await this.client.category.findUnique({
        where: { slug: override.categorySlug },
      });
      if (!category) continue;
      await this.client.methodologyCategoryOverride.create({
        data: {
          methodologyVersionId: version.id,
          categoryId: category.id,
          disabledCriterionIds: [...override.disabledCriteria],
          weightOverrides: override.weightOverrides,
        },
      });
    }
  }

  async setActiveForCategory(
    categorySlug: string,
    methodologyId: string,
    version: string,
  ): Promise<void> {
    const category = await this.client.category.findUniqueOrThrow({
      where: { slug: categorySlug },
    });
    const methodologyVersion = await this.client.methodologyVersion.findFirstOrThrow({
      where: { methodology: { id: methodologyId }, version },
    });

    await this.client.methodology.updateMany({
      where: { id: methodologyId, categoryId: null },
      data: { categoryId: category.id },
    });

    await this.client.categoryActiveMethodology.upsert({
      where: { categoryId: category.id },
      create: { categoryId: category.id, methodologyVersionId: methodologyVersion.id },
      update: { methodologyVersionId: methodologyVersion.id, activatedAt: new Date() },
    });
  }
}
