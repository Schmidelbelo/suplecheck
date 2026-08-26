import type { CriterionId } from "../value-objects/CriterionId";
import type { Weight } from "../value-objects/Weight";

/**
 * Associação entre um critério (por id, não por instância — a
 * `Methodology` é configuração pura, resolvida contra um
 * `CriterionRegistry` apenas no momento do cálculo) e o peso que ele tem
 * na fórmula. `enabled` permite desligar um critério numa metodologia
 * específica sem removê-lo do registro global.
 */
export class CriterionAssignment {
  private constructor(
    public readonly criterionId: CriterionId,
    public readonly weight: Weight,
    public readonly enabled: boolean,
  ) {}

  static of(criterionId: CriterionId, weight: Weight, enabled = true): CriterionAssignment {
    return new CriterionAssignment(criterionId, weight, enabled);
  }

  withWeight(weight: Weight): CriterionAssignment {
    return new CriterionAssignment(this.criterionId, weight, this.enabled);
  }

  disabled(): CriterionAssignment {
    return new CriterionAssignment(this.criterionId, this.weight, false);
  }
}
