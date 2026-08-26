import type { Criterion, CriterionEvaluationResult, CriterionMetadata } from "../Criterion";
import { CriterionId } from "../../value-objects/CriterionId";
import { Score } from "../../value-objects/Score";
import { TechnicalNote, ValidationFlag } from "../../value-objects/TechnicalNote";
import { CriterionKind, EvidenceQuality, ValidationSeverity } from "../../enums/EvidenceQuality";
import type { EvaluationContext } from "../../evaluation/EvaluationContext";
import { FactKeys, type ReputationFacts } from "../../evaluation/Facts";

/** Abaixo deste número de avaliações, a nota é amortecida em direção a um valor neutro (evita que 2 reviews de 5 estrelas dominem). */
const MIN_RELIABLE_REVIEW_COUNT = 20;
const NEUTRAL_RATIO = 0.6;

export class ReputationCriterion implements Criterion {
  readonly metadata: CriterionMetadata = {
    id: CriterionId.of("reputation"),
    name: "Reputação",
    description:
      "Avaliação média de compradores, amortecida pela quantidade de avaliações disponíveis.",
    kind: CriterionKind.SIMPLE,
  };

  evaluate(context: EvaluationContext): CriterionEvaluationResult {
    const reputation = context.get<ReputationFacts>(FactKeys.REPUTATION);

    if (!reputation) {
      return {
        criterionId: this.metadata.id,
        score: Score.fromRatio(0.5),
        notes: [
          TechnicalNote.of(
            "Dados de reputação ausentes; nota neutra atribuída.",
            EvidenceQuality.UNVERIFIED,
          ),
        ],
        flags: [
          ValidationFlag.of(
            "MISSING_REPUTATION_DATA",
            "Fatos de reputação não informados.",
            ValidationSeverity.CRITICAL,
          ),
        ],
      };
    }

    const rawRatio = clamp01(reputation.averageRating / 5);
    const confidence = clamp01(reputation.reviewCount / MIN_RELIABLE_REVIEW_COUNT);
    const dampenedRatio = rawRatio * confidence + NEUTRAL_RATIO * (1 - confidence);

    const flags =
      reputation.reviewCount < MIN_RELIABLE_REVIEW_COUNT
        ? [
            ValidationFlag.of(
              "LOW_REVIEW_COUNT",
              `Apenas ${reputation.reviewCount} avaliação(ões) — nota amortecida por baixa confiança estatística.`,
            ),
          ]
        : [];

    return {
      criterionId: this.metadata.id,
      score: Score.fromRatio(dampenedRatio),
      notes: [
        TechnicalNote.of(
          `Nota média ${reputation.averageRating.toFixed(1)}/5 em ${reputation.reviewCount} avaliações.`,
          reputation.reviewCount >= MIN_RELIABLE_REVIEW_COUNT
            ? EvidenceQuality.HIGH
            : EvidenceQuality.LOW,
        ),
      ],
      flags,
    };
  }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
