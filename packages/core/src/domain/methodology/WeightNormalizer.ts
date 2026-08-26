import type { CriterionId } from "../value-objects/CriterionId";
import { Weight } from "../value-objects/Weight";

export interface WeightedCriterionRef {
  readonly criterionId: CriterionId;
  readonly weight: Weight;
}

/**
 * Redistribui pesos proporcionalmente para que voltem a somar 1 (100%).
 * Necessário sempre que um subconjunto de critérios é desativado em
 * tempo de resolução (ex: override de categoria) — sem isso, a nota
 * final ficaria artificialmente baixa por "peso perdido".
 */
export class WeightNormalizer {
  static normalize(items: readonly WeightedCriterionRef[]): WeightedCriterionRef[] {
    const total = items.reduce((sum, item) => sum + item.weight.value, 0);
    if (total === 0) {
      return [];
    }
    return items.map((item) => ({
      criterionId: item.criterionId,
      weight: Weight.of(item.weight.value / total),
    }));
  }
}
