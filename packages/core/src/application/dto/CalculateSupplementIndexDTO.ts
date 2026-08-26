import type { SupplementProfile } from "../../domain/entities/SupplementProfile";
import type { Methodology } from "../../domain/methodology/Methodology";
import type { EvaluationContext } from "../../domain/evaluation/EvaluationContext";

export interface CalculateSupplementIndexInput {
  readonly supplement: SupplementProfile;
  readonly methodology: Methodology;
  readonly context: EvaluationContext;
}
