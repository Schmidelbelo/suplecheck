import type { Criterion, CriterionEvaluationResult, CriterionMetadata } from "../Criterion";
import { CriterionId } from "../../value-objects/CriterionId";
import { Score } from "../../value-objects/Score";
import { TechnicalNote, ValidationFlag } from "../../value-objects/TechnicalNote";
import { CriterionKind, EvidenceQuality, ValidationSeverity } from "../../enums/EvidenceQuality";
import type { EvaluationContext } from "../../evaluation/EvaluationContext";
import { FactKeys, type StoreFacts } from "../../evaluation/Facts";

const BUYER_PROTECTION_BONUS = 5;

export class StoreReliabilityCriterion implements Criterion {
  readonly metadata: CriterionMetadata = {
    id: CriterionId.of("store-reliability"),
    name: "Confiabilidade da loja",
    description: "Reputação e garantias oferecidas pela loja que vende o produto avaliado.",
    kind: CriterionKind.SIMPLE,
  };

  evaluate(context: EvaluationContext): CriterionEvaluationResult {
    const store = context.get<StoreFacts>(FactKeys.STORE);

    if (!store) {
      return {
        criterionId: this.metadata.id,
        score: Score.fromRatio(0.5),
        notes: [
          TechnicalNote.of(
            "Dados da loja ausentes; nota neutra atribuída.",
            EvidenceQuality.UNVERIFIED,
          ),
        ],
        flags: [
          ValidationFlag.of(
            "MISSING_STORE_DATA",
            "Fatos da loja não informados.",
            ValidationSeverity.CRITICAL,
          ),
        ],
      };
    }

    const boosted = store.trustScore + (store.hasBuyerProtection ? BUYER_PROTECTION_BONUS : 0);

    return {
      criterionId: this.metadata.id,
      score: Score.of(Math.min(100, boosted)),
      notes: [
        TechnicalNote.of(
          store.hasBuyerProtection
            ? "Loja com garantia de proteção ao comprador."
            : "Loja sem garantia declarada de proteção ao comprador.",
        ),
      ],
      flags: [],
    };
  }
}
