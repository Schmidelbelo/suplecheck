import type { Criterion, CriterionEvaluationResult, CriterionMetadata } from "../Criterion";
import { CriterionId } from "../../value-objects/CriterionId";
import { Score } from "../../value-objects/Score";
import { TechnicalNote, ValidationFlag } from "../../value-objects/TechnicalNote";
import { CriterionKind, EvidenceQuality, ValidationSeverity } from "../../enums/EvidenceQuality";
import type { EvaluationContext } from "../../evaluation/EvaluationContext";
import { FactKeys, type CompositionFacts, type LabelFacts } from "../../evaluation/Facts";

const PENALTY_PROPRIETARY_BLEND = 35;
const PENALTY_INCOMPLETE_NUTRITION = 25;
const PENALTY_UNCLEAR_DOSAGE = 20;
const PENALTY_PER_UNDISCLOSED_SUBSTANCE = 10;

/** Penaliza rótulos que escondem informação — mistura proprietária, dado incompleto, substância não declarada. */
export class LabelTransparencyCriterion implements Criterion {
  readonly metadata: CriterionMetadata = {
    id: CriterionId.of("label-transparency"),
    name: "Transparência do rótulo",
    description: "Mede o quanto o rótulo expõe claramente composição e dosagem, sem omissões.",
    kind: CriterionKind.SIMPLE,
  };

  evaluate(context: EvaluationContext): CriterionEvaluationResult {
    const label = context.get<LabelFacts>(FactKeys.LABEL);
    const composition = context.get<CompositionFacts>(FactKeys.COMPOSITION);

    if (!label) {
      return {
        criterionId: this.metadata.id,
        score: Score.fromRatio(0.5),
        notes: [
          TechnicalNote.of(
            "Dados de rótulo ausentes; nota neutra atribuída.",
            EvidenceQuality.UNVERIFIED,
          ),
        ],
        flags: [
          ValidationFlag.of(
            "MISSING_LABEL_DATA",
            "Fatos de rótulo não informados.",
            ValidationSeverity.CRITICAL,
          ),
        ],
      };
    }

    let points = 100;
    const notes: TechnicalNote[] = [];

    if (label.hasProprietaryBlend) {
      points -= PENALTY_PROPRIETARY_BLEND;
      notes.push(
        TechnicalNote.of("Rótulo usa mistura proprietária (dosagem individual não declarada)."),
      );
    }
    if (!label.nutritionalInfoComplete) {
      points -= PENALTY_INCOMPLETE_NUTRITION;
      notes.push(TechnicalNote.of("Informação nutricional incompleta."));
    }
    if (!label.dosageClearlyStated) {
      points -= PENALTY_UNCLEAR_DOSAGE;
      notes.push(TechnicalNote.of("Dosagem por porção não declarada com clareza."));
    }

    const undisclosedCount = composition?.undisclosedSubstances.length ?? 0;
    if (undisclosedCount > 0) {
      points -= undisclosedCount * PENALTY_PER_UNDISCLOSED_SUBSTANCE;
      notes.push(
        TechnicalNote.of(
          `${undisclosedCount} substância(s) identificada(s) e não declaradas no rótulo.`,
        ),
      );
    }

    return {
      criterionId: this.metadata.id,
      score: Score.of(Math.max(0, points)),
      notes,
      flags: [],
    };
  }
}
