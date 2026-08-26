import type { Criterion, CriterionEvaluationResult, CriterionMetadata } from "../Criterion";
import { CriterionId } from "../../value-objects/CriterionId";
import { Score } from "../../value-objects/Score";
import { TechnicalNote, ValidationFlag } from "../../value-objects/TechnicalNote";
import { CriterionKind, ValidationSeverity } from "../../enums/EvidenceQuality";
import type { EvaluationContext } from "../../evaluation/EvaluationContext";
import { FactKeys, type MarketingClaimsFacts } from "../../evaluation/Facts";

/**
 * Penaliza promessas de marketing sem respaldo científico. Quanto maior a
 * proporção de alegações não sustentadas, menor a nota.
 */
export class ExaggeratedClaimsCriterion implements Criterion {
  readonly metadata: CriterionMetadata = {
    id: CriterionId.of("exaggerated-claims"),
    name: "Promessas exageradas",
    description: "Proporção de alegações de marketing sem respaldo científico identificável.",
    kind: CriterionKind.SIMPLE,
  };

  evaluate(context: EvaluationContext): CriterionEvaluationResult {
    const marketing = context.get<MarketingClaimsFacts>(FactKeys.MARKETING_CLAIMS);

    if (!marketing || marketing.claims.length === 0) {
      return {
        criterionId: this.metadata.id,
        score: Score.max(),
        notes: [TechnicalNote.of("Nenhuma alegação de marketing identificada para analisar.")],
        flags: [],
      };
    }

    const supportedCount = marketing.scientificallySupportedClaims.length;
    const ratio = supportedCount / marketing.claims.length;

    const flags =
      ratio < 0.5
        ? [
            ValidationFlag.of(
              "HIGH_UNSUPPORTED_CLAIMS_RATIO",
              `${marketing.claims.length - supportedCount} de ${marketing.claims.length} alegações sem respaldo identificado.`,
              ValidationSeverity.WARNING,
            ),
          ]
        : [];

    return {
      criterionId: this.metadata.id,
      score: Score.fromRatio(ratio),
      notes: [
        TechnicalNote.of(
          `${supportedCount}/${marketing.claims.length} alegações com respaldo científico identificado.`,
        ),
      ],
      flags,
    };
  }
}
