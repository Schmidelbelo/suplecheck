import type { Methodology } from "../domain-kernel";
import {
  MethodologyBuilder,
  MethodologyVersion,
  ClassificationSystem,
  ClassificationBand,
  CategoryOverride,
  CriterionId,
  Weight,
  Score,
  type AggregationStrategy,
} from "../domain-kernel";
import type {
  MethodologyDTO,
  CriterionAssignmentDTO,
  ClassificationBandDTO,
  CategoryOverrideDTO,
} from "../dto/MethodologyDTO";
import type {
  CreateMethodologyCommand,
  CreateMethodologyCriterionInput,
} from "../commands/MethodologyCommands";

export interface MethodologyDTOExtras {
  /** Bandas de classificação originais (a Application as fornece — `Methodology.classification`, do Domain, não expõe iteração; ver ARCHITECTURE.md §6). */
  readonly classification?: readonly ClassificationBandDTO[];
  readonly categoryOverrides?: readonly CategoryOverrideDTO[];
}

/**
 * Converte entre a `Methodology` do Domain e a forma pública
 * (`MethodologyDTO`), nas duas direções. `Methodology` nunca atravessa
 * um Port nem chega a Infrastructure/Presentation — só `MethodologyDTO`.
 */
export const MethodologyMapper = {
  /**
   * `extras` existe porque `Methodology` (Domain) não expõe iteração
   * pública de `classification`/`categoryOverrides` (só `classify(score)`
   * e `overrideFor(slug)` pontuais) — quem chama e já tem essa informação
   * à mão (ex: o `CreateMethodologyCommand` original) deve repassá-la.
   * Sem `extras`, o DTO fica correto em id/nome/versão/assignments, mas
   * com classificação/overrides vazios (limitação documentada, não um bug
   * silencioso).
   */
  toDTO(methodology: Methodology, extras: MethodologyDTOExtras = {}): MethodologyDTO {
    return {
      id: methodology.id,
      name: methodology.name,
      version: methodology.version.toString(),
      aggregationStrategyName: methodology.aggregation.name,
      assignments: methodology.assignments.map((assignment): CriterionAssignmentDTO => ({
        criterionId: assignment.criterionId.value,
        weight: assignment.weight.value,
        enabled: assignment.enabled,
      })),
      classification: extras.classification ?? [],
      categoryOverrides: extras.categoryOverrides ?? [],
    };
  },

  /** Reconstrói a `Methodology` do Domain a partir do DTO persistido — usado sempre que um Use Case precisa do comportamento (`revise`, `overrideFor`, cálculo). */
  fromDTO(dto: MethodologyDTO): Methodology {
    const builder = MethodologyBuilder.create()
      .withId(dto.id)
      .withName(dto.name)
      .withVersion(MethodologyVersion.of(dto.version));

    for (const assignment of dto.assignments) {
      builder.addCriterion(assignment.criterionId, assignment.weight, assignment.enabled);
    }
    if (dto.classification.length > 0) {
      builder.withClassification(MethodologyMapper.classificationFromDTO(dto.classification));
    }
    for (const override of dto.categoryOverrides) {
      builder.withCategoryOverride(MethodologyMapper.categoryOverrideFromDTO(override));
    }

    return builder.build();
  },

  classificationFromDTO(bands: readonly ClassificationBandDTO[]): ClassificationSystem {
    return ClassificationSystem.of(
      bands.map((band) =>
        ClassificationBand.of(band.tier, Score.of(band.minScore), band.label, band.description),
      ),
    );
  },

  categoryOverrideFromDTO(dto: CategoryOverrideDTO): CategoryOverride {
    return CategoryOverride.of(dto.categorySlug, {
      disabledCriteria: dto.disabledCriteria.map((id) => CriterionId.of(id)),
      weightOverrides: new Map(
        Object.entries(dto.weightOverrides).map(([id, w]) => [id, Weight.of(w)]),
      ),
      classification: dto.classification
        ? MethodologyMapper.classificationFromDTO(dto.classification)
        : undefined,
    });
  },

  /** Constrói uma `Methodology` nova (versão 1.0.0) a partir de um comando de aplicação. */
  fromCreateCommand(
    command: CreateMethodologyCommand,
    aggregation?: AggregationStrategy,
  ): Methodology {
    const builder = MethodologyBuilder.create().withId(command.id).withName(command.name);

    for (const criterion of command.criteria) {
      builder.addCriterion(criterion.criterionId, criterion.weight, criterion.enabled ?? true);
    }
    if (command.classification) {
      builder.withClassification(MethodologyMapper.classificationFromDTO(command.classification));
    }
    if (aggregation) builder.withAggregation(aggregation);
    for (const override of command.categoryOverrides ?? []) {
      builder.withCategoryOverride(MethodologyMapper.categoryOverrideFromDTO(override));
    }
    if (command.normalizeWeights) builder.normalizeWeights();

    return builder.build();
  },

  criteriaInputToAssignments(
    criteria: readonly CreateMethodologyCriterionInput[],
  ): { criterionId: string; weight: number; enabled: boolean }[] {
    return criteria.map((c) => ({
      criterionId: c.criterionId,
      weight: c.weight,
      enabled: c.enabled ?? true,
    }));
  },
};
