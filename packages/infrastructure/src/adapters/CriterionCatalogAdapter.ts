import type { CriterionCatalogPort } from "../application-kernel";
import {
  builtInCriteria,
  CriterionRegistry,
  CriterionStatus,
  type Criterion,
  type CriterionId,
} from "../core-kernel";
import type { InMemoryDatabase } from "../persistence/inmemory/InMemoryDatabase";

/**
 * Único adapter que importa `core-kernel` (ver esse arquivo para a
 * justificativa). Carrega os critérios embutidos do Domain na
 * inicialização; o status (ativo/desativado/depreciado) de cada um é
 * persistido separadamente (hoje em `InMemoryDatabase`), então
 * `loadRegistry()` sempre reflete o último status conhecido.
 */
export class CriterionCatalogAdapter implements CriterionCatalogPort {
  private readonly criteria = new Map<string, Criterion>();
  private readonly statuses: Map<string, CriterionStatus>;

  constructor(db: InMemoryDatabase) {
    this.statuses = db.table<CriterionStatus>("criterion_status");
    for (const criterion of builtInCriteria()) {
      this.criteria.set(criterion.metadata.id.value, criterion);
      if (!this.statuses.has(criterion.metadata.id.value)) {
        this.statuses.set(criterion.metadata.id.value, CriterionStatus.ACTIVE);
      }
    }
  }

  async loadRegistry(): Promise<CriterionRegistry> {
    const registry = new CriterionRegistry();
    for (const [id, criterion] of this.criteria) {
      registry.register(criterion, this.statuses.get(id));
    }
    return registry;
  }

  async register(criterion: Criterion): Promise<void> {
    this.criteria.set(criterion.metadata.id.value, criterion);
    if (!this.statuses.has(criterion.metadata.id.value)) {
      this.statuses.set(criterion.metadata.id.value, CriterionStatus.ACTIVE);
    }
  }

  async setStatus(criterionId: CriterionId, status: CriterionStatus): Promise<void> {
    this.statuses.set(criterionId.value, status);
  }

  async listAll(): Promise<Criterion[]> {
    return [...this.criteria.values()];
  }
}
