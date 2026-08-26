import type { CriterionId } from "../value-objects/CriterionId";
import type { Score } from "../value-objects/Score";
import type { Weight } from "../value-objects/Weight";
import type { TechnicalNote, ValidationFlag } from "../value-objects/TechnicalNote";
import type { MethodologyVersion } from "../value-objects/MethodologyVersion";
import type { ClassificationBand } from "../classification/ClassificationBand";

export interface CriterionBreakdownEntry {
  readonly criterionId: CriterionId;
  readonly score: Score;
  readonly weight: Weight;
  readonly notes: readonly TechnicalNote[];
  readonly flags: readonly ValidationFlag[];
}

/**
 * Resultado imutável de um cálculo do Índice SupleCheck. Equivale, em
 * conceito, ao `ProductScore` do Prisma (packages/database) — mas é um
 * objeto de domínio puro, sem id de banco nem acoplamento de
 * persistência. Cada cálculo produz uma NOVA instância; nunca existe uma
 * operação de "atualizar" um resultado (ver ARCHITECTURE.md §8).
 */
export class SupleCheckIndexResult {
  private constructor(
    public readonly supplementId: string,
    public readonly categorySlug: string,
    public readonly methodologyId: string,
    public readonly methodologyVersion: MethodologyVersion,
    public readonly finalScore: Score,
    public readonly classification: ClassificationBand,
    public readonly breakdown: readonly CriterionBreakdownEntry[],
    public readonly calculatedAt: Date,
  ) {}

  static of(props: {
    supplementId: string;
    categorySlug: string;
    methodologyId: string;
    methodologyVersion: MethodologyVersion;
    finalScore: Score;
    classification: ClassificationBand;
    breakdown: readonly CriterionBreakdownEntry[];
    calculatedAt?: Date;
  }): SupleCheckIndexResult {
    return new SupleCheckIndexResult(
      props.supplementId,
      props.categorySlug,
      props.methodologyId,
      props.methodologyVersion,
      props.finalScore,
      props.classification,
      props.breakdown,
      props.calculatedAt ?? new Date(),
    );
  }

  /** Todos os alertas críticos levantados por qualquer critério — o que merece atenção humana antes de publicar a nota. */
  criticalWarnings(): ValidationFlag[] {
    return this.breakdown.flatMap((entry) => entry.flags).filter((flag) => flag.isCritical());
  }
}
