import type { PrismaClient } from "@prisma/client";
import type { CriterionCatalogPort } from "../../application-kernel";
import {
  builtInCriteria,
  CriterionRegistry,
  CriterionStatus,
  type Criterion,
  type CriterionId,
} from "../../core-kernel";

/**
 * Implementação real de `CriterionCatalogPort` sobre Prisma — mesma
 * estrutura do antigo `CriterionCatalogAdapter` (in-memory), mas o
 * status (ativo/desativado/depreciado) de cada critério agora sobrevive
 * a um restart de verdade, persistido na tabela `criteria`. O
 * comportamento de cálculo continua vindo só do código
 * (`builtInCriteria()`) — a tabela nunca guarda lógica, só identidade e
 * status (ver `Criterion.evaluate()`, Domain).
 */
export class PrismaCriterionCatalogAdapter implements CriterionCatalogPort {
  private readonly criteria = new Map<string, Criterion>();

  constructor(private readonly client: PrismaClient) {
    for (const criterion of builtInCriteria()) {
      this.criteria.set(criterion.metadata.id.value, criterion);
    }
  }

  private async ensureRowsExist(): Promise<void> {
    // `Promise.all` em vez de upsert sequencial — o conjunto é pequeno e
    // fixo (critérios embutidos no código), mas nada impede paralelizar.
    await Promise.all(
      [...this.criteria.values()].map((criterion) =>
        this.client.criterion.upsert({
          where: { id: criterion.metadata.id.value },
          create: {
            id: criterion.metadata.id.value,
            name: criterion.metadata.name,
            description: criterion.metadata.description,
            kind: criterion.metadata.kind,
            applicableCategories: criterion.metadata.applicableCategories
              ? [...criterion.metadata.applicableCategories]
              : undefined,
          },
          // Corrige qualquer placeholder que `PrismaMethodologyRepository.save`
          // possa ter criado antes desta linha existir (uma metodologia pode
          // referenciar um critério antes de qualquer avaliação rodar
          // `loadRegistry()` pela primeira vez) — nunca sobrescreve o status,
          // que é gerenciado só por `setStatus`.
          update: {
            name: criterion.metadata.name,
            description: criterion.metadata.description,
            kind: criterion.metadata.kind,
          },
        }),
      ),
    );
  }

  async loadRegistry(): Promise<CriterionRegistry> {
    await this.ensureRowsExist();
    const rows = await this.client.criterion.findMany({
      where: { id: { in: [...this.criteria.keys()] } },
    });
    const statusById = new Map(rows.map((row) => [row.id, row.status as CriterionStatus]));

    const registry = new CriterionRegistry();
    for (const [id, criterion] of this.criteria) {
      registry.register(criterion, statusById.get(id) ?? CriterionStatus.ACTIVE);
    }
    return registry;
  }

  async register(criterion: Criterion): Promise<void> {
    this.criteria.set(criterion.metadata.id.value, criterion);
    await this.client.criterion.upsert({
      where: { id: criterion.metadata.id.value },
      create: {
        id: criterion.metadata.id.value,
        name: criterion.metadata.name,
        description: criterion.metadata.description,
        kind: criterion.metadata.kind,
        applicableCategories: criterion.metadata.applicableCategories
          ? [...criterion.metadata.applicableCategories]
          : undefined,
      },
      update: {},
    });
  }

  async setStatus(criterionId: CriterionId, status: CriterionStatus): Promise<void> {
    await this.client.criterion.update({ where: { id: criterionId.value }, data: { status } });
  }

  async listAll(): Promise<Criterion[]> {
    return [...this.criteria.values()];
  }
}
