import type { Criterion } from "./Criterion";
import type { CriterionId } from "../value-objects/CriterionId";
import { CriterionStatus } from "../enums/EvidenceQuality";
import { DuplicateCriterionError, UnknownCriterionError } from "../errors/DomainError";

/**
 * Catálogo de critérios disponíveis na plataforma. É o ponto único de
 * extensão do sistema de critérios: registrar um novo critério aqui
 * (embutido ou de terceiros) o torna elegível para compor metodologias,
 * sem qualquer alteração no `ScoringEngine` (Open/Closed Principle).
 *
 * O registro também guarda o `CriterionStatus` — desativar um critério é
 * uma operação sobre o registro, não sobre o critério em si.
 */
export class CriterionRegistry {
  private readonly criteria = new Map<string, Criterion>();
  private readonly statuses = new Map<string, CriterionStatus>();

  register(criterion: Criterion, status: CriterionStatus = CriterionStatus.ACTIVE): this {
    const id = criterion.metadata.id.value;
    if (this.criteria.has(id)) {
      throw new DuplicateCriterionError(id);
    }
    this.criteria.set(id, criterion);
    this.statuses.set(id, status);
    return this;
  }

  activate(id: CriterionId): void {
    this.setStatus(id, CriterionStatus.ACTIVE);
  }

  disable(id: CriterionId): void {
    this.setStatus(id, CriterionStatus.DISABLED);
  }

  deprecate(id: CriterionId): void {
    this.setStatus(id, CriterionStatus.DEPRECATED);
  }

  private setStatus(id: CriterionId, status: CriterionStatus): void {
    if (!this.criteria.has(id.value)) {
      throw new UnknownCriterionError(id.value);
    }
    this.statuses.set(id.value, status);
  }

  statusOf(id: CriterionId): CriterionStatus {
    const status = this.statuses.get(id.value);
    if (!status) {
      throw new UnknownCriterionError(id.value);
    }
    return status;
  }

  isActive(id: CriterionId): boolean {
    return this.statusOf(id) === CriterionStatus.ACTIVE;
  }

  get(id: CriterionId): Criterion {
    const criterion = this.criteria.get(id.value);
    if (!criterion) {
      throw new UnknownCriterionError(id.value);
    }
    return criterion;
  }

  list(): Criterion[] {
    return [...this.criteria.values()];
  }

  listActive(): Criterion[] {
    return this.list().filter((criterion) => this.isActive(criterion.metadata.id));
  }
}
