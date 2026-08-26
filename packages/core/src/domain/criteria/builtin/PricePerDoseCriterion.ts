import type { Criterion, CriterionEvaluationResult, CriterionMetadata } from "../Criterion";
import { CriterionId } from "../../value-objects/CriterionId";
import { Score } from "../../value-objects/Score";
import { TechnicalNote, ValidationFlag } from "../../value-objects/TechnicalNote";
import { CriterionKind, EvidenceQuality, ValidationSeverity } from "../../enums/EvidenceQuality";
import type { EvaluationContext } from "../../evaluation/EvaluationContext";
import { FactKeys, type PricingFacts } from "../../evaluation/Facts";

/**
 * Compara o preço por dose do produto com a média de preço por dose da
 * categoria. Quanto mais abaixo da média, maior a nota — sem exigir que
 * o motor de cálculo saiba o que é "dose" ou "categoria".
 */
export class PricePerDoseCriterion implements Criterion {
  readonly metadata: CriterionMetadata = {
    id: CriterionId.of("price-per-dose"),
    name: "Preço por dose",
    description: "Compara o custo por dose do produto com a média de mercado da categoria.",
    kind: CriterionKind.SIMPLE,
  };

  evaluate(context: EvaluationContext): CriterionEvaluationResult {
    const pricing = context.get<PricingFacts>(FactKeys.PRICING);

    if (!pricing) {
      return {
        criterionId: this.metadata.id,
        score: Score.fromRatio(0.5),
        notes: [
          TechnicalNote.of(
            "Dado de preço ausente; nota neutra atribuída.",
            EvidenceQuality.UNVERIFIED,
          ),
        ],
        flags: [
          ValidationFlag.of(
            "MISSING_PRICING",
            "Fatos de preço não informados.",
            ValidationSeverity.CRITICAL,
          ),
        ],
      };
    }

    const pricePerDose = pricing.priceInCents / pricing.dosesPerUnit;

    if (!pricing.categoryAveragePricePerDoseInCents) {
      return {
        criterionId: this.metadata.id,
        score: Score.fromRatio(0.5),
        notes: [
          TechnicalNote.of(
            `Preço por dose calculado (${(pricePerDose / 100).toFixed(2)}), mas sem média de categoria para comparação.`,
            EvidenceQuality.LOW,
          ),
        ],
        flags: [
          ValidationFlag.of(
            "MISSING_CATEGORY_AVERAGE",
            "Média de preço por dose da categoria não informada.",
          ),
        ],
      };
    }

    const average = pricing.categoryAveragePricePerDoseInCents;
    // 40% abaixo da média (ou mais) => nota máxima; 40% acima (ou mais) => nota mínima.
    const deviation = (average - pricePerDose) / average;
    const ratio = 0.5 + deviation / 0.8;

    return {
      criterionId: this.metadata.id,
      score: Score.fromRatio(ratio),
      notes: [
        TechnicalNote.of(
          `Preço por dose ${(pricePerDose / 100).toFixed(2)} vs. média de categoria ${(average / 100).toFixed(2)}.`,
        ),
      ],
      flags: [],
    };
  }
}
