import type { Criterion } from "../Criterion";
import { CostBenefitCriterion } from "./CostBenefitCriterion";
import { PricePerDoseCriterion } from "./PricePerDoseCriterion";
import { LabelTransparencyCriterion } from "./LabelTransparencyCriterion";
import { ReputationCriterion } from "./ReputationCriterion";
import { ExaggeratedClaimsCriterion } from "./ExaggeratedClaimsCriterion";
import { StoreReliabilityCriterion } from "./StoreReliabilityCriterion";

export {
  CostBenefitCriterion,
  PricePerDoseCriterion,
  LabelTransparencyCriterion,
  ReputationCriterion,
  ExaggeratedClaimsCriterion,
  StoreReliabilityCriterion,
};

/**
 * Conjunto de critérios embutidos na plataforma hoje. Novos critérios
 * (embutidos ou de terceiros) NÃO entram nesta lista para existir — basta
 * implementar `Criterion` e chamar `registry.register(...)`. Esta função
 * é só uma conveniência para popular um `CriterionRegistry` novo.
 */
export function builtInCriteria(): Criterion[] {
  return [
    new CostBenefitCriterion(),
    new PricePerDoseCriterion(),
    new LabelTransparencyCriterion(),
    new ReputationCriterion(),
    new ExaggeratedClaimsCriterion(),
    new StoreReliabilityCriterion(),
  ];
}
