import type { CriterionAssignment } from "./CriterionAssignment";
import type { CategoryOverride } from "./CategoryOverride";
import type { MethodologyVersion } from "../value-objects/MethodologyVersion";
import type { ClassificationSystem } from "../classification/ClassificationSystem";
import { WeightSumMismatchError } from "../errors/DomainError";
import type { AggregationStrategy } from "../scoring/AggregationStrategy";
import { WeightedAverageAggregationStrategy } from "../scoring/AggregationStrategy";

export interface MethodologyProps {
  readonly id: string;
  readonly name: string;
  readonly version: MethodologyVersion;
  readonly assignments: readonly CriterionAssignment[];
  readonly classification: ClassificationSystem;
  readonly aggregation: AggregationStrategy;
  readonly categoryOverrides: ReadonlyMap<string, CategoryOverride>;
}

/**
 * A metodologia é o "coração configurável" do Índice SupleCheck: qual
 * conjunto de critérios entra na fórmula, com qual peso, agregados de
 * qual forma, e traduzidos em qual sistema de classificação — tudo dado,
 * nada hardcoded no motor (`ScoringEngine`).
 *
 * Imutável e versionada: qualquer mudança de composição de critérios ou
 * pesos produz uma NOVA `Methodology` (nova `MethodologyVersion`), nunca
 * uma mutação da existente — resultados calculados no passado continuam
 * reproduzíveis contra a versão que os gerou.
 */
export class Methodology {
  private constructor(private readonly props: MethodologyProps) {}

  static of(props: MethodologyProps): Methodology {
    Methodology.assertUniqueAssignments(props.assignments);
    Methodology.assertWeightsSumToOne(props.assignments, props.id);
    return new Methodology(props);
  }

  private static assertUniqueAssignments(assignments: readonly CriterionAssignment[]): void {
    const seen = new Set<string>();
    for (const assignment of assignments) {
      if (seen.has(assignment.criterionId.value)) {
        throw new Error(
          `Critério "${assignment.criterionId}" foi atribuído mais de uma vez na metodologia.`,
        );
      }
      seen.add(assignment.criterionId.value);
    }
  }

  private static assertWeightsSumToOne(
    assignments: readonly CriterionAssignment[],
    methodologyId: string,
  ): void {
    const enabled = assignments.filter((assignment) => assignment.enabled);
    if (enabled.length === 0) return; // validado em outro ponto (NoActiveCriteriaError) no momento do cálculo.
    const sum = enabled.reduce((total, assignment) => total + assignment.weight.value, 0);
    if (Math.abs(sum - 1) > 1e-6) {
      throw new WeightSumMismatchError(sum, `metodologia "${methodologyId}"`);
    }
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get version(): MethodologyVersion {
    return this.props.version;
  }

  get assignments(): readonly CriterionAssignment[] {
    return this.props.assignments;
  }

  get classification(): ClassificationSystem {
    return this.props.classification;
  }

  get aggregation(): AggregationStrategy {
    return this.props.aggregation;
  }

  overrideFor(categorySlug: string): CategoryOverride | undefined {
    return this.props.categoryOverrides.get(categorySlug);
  }

  /** Produz uma nova versão da metodologia com pesos/critérios alterados — nunca modifica esta instância. */
  revise(
    changes: Partial<Omit<MethodologyProps, "id" | "version">>,
    bump: "major" | "minor" | "patch" = "minor",
  ): Methodology {
    const nextVersion =
      bump === "major"
        ? this.props.version.nextMajor()
        : bump === "minor"
          ? this.props.version.nextMinor()
          : this.props.version.nextPatch();

    return Methodology.of({
      ...this.props,
      ...changes,
      id: this.props.id,
      version: nextVersion,
    });
  }
}

export function defaultAggregation(): AggregationStrategy {
  return new WeightedAverageAggregationStrategy();
}
