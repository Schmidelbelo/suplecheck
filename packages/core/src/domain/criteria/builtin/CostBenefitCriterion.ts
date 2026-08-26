import type { Criterion, CriterionEvaluationResult, CriterionMetadata } from "../Criterion";
import { CriterionId } from "../../value-objects/CriterionId";
import { Score } from "../../value-objects/Score";
import { TechnicalNote, ValidationFlag } from "../../value-objects/TechnicalNote";
import { CriterionKind, EvidenceQuality, ValidationSeverity } from "../../enums/EvidenceQuality";
import type { EvaluationContext } from "../../evaluation/EvaluationContext";
import { FactKeys, type CompositionFacts, type PricingFacts } from "../../evaluation/Facts";

/**
 * Custo-benefício = o quanto de princípio ativo o comprador recebe por
 * real gasto. Combina adequação da dosagem (composição) com preço —
 * diferente de `PricePerDoseCriterion`, que só compara preço entre pares.
 */
export class CostBenefitCriterion implements Criterion {
  readonly metadata: CriterionMetadata = {
    id: CriterionId.of("cost-benefit"),
    name: "Custo-benefício",
    description: "Relação entre a quantidade efetiva de princípio ativo entregue e o preço pago.",
    kind: CriterionKind.SIMPLE,
  };

  evaluate(context: EvaluationContext): CriterionEvaluationResult {
    const composition = context.get<CompositionFacts>(FactKeys.COMPOSITION);
    const pricing = context.get<PricingFacts>(FactKeys.PRICING);

    if (!composition || !pricing) {
      return {
        criterionId: this.metadata.id,
        score: Score.fromRatio(0.5),
        notes: [
          TechnicalNote.of(
            "Dados de composição ou preço ausentes; nota neutra atribuída.",
            EvidenceQuality.UNVERIFIED,
          ),
        ],
        flags: [
          ValidationFlag.of(
            "MISSING_DATA",
            "Composição ou preço não informados.",
            ValidationSeverity.CRITICAL,
          ),
        ],
      };
    }

    const { min, max } = composition.referenceRangePerServing;
    const dosageAdequacy = clamp01(
      (composition.activeIngredientAmountPerServing - min) / (max - min || 1),
    );

    const pricePerDose = pricing.priceInCents / pricing.dosesPerUnit;
    const priceEfficiency = pricing.categoryAveragePricePerDoseInCents
      ? clamp01(pricing.categoryAveragePricePerDoseInCents / (pricePerDose || 1) / 2)
      : 0.5;

    const ratio = dosageAdequacy * 0.6 + priceEfficiency * 0.4;

    return {
      criterionId: this.metadata.id,
      score: Score.fromRatio(ratio),
      notes: [
        TechnicalNote.of(
          `Adequação de dosagem: ${(dosageAdequacy * 100).toFixed(0)}%. Eficiência de preço: ${(priceEfficiency * 100).toFixed(0)}%.`,
        ),
      ],
      flags: [],
    };
  }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
