import { MethodologyBuilder } from "../../domain/methodology/MethodologyBuilder";
import type { Methodology } from "../../domain/methodology/Methodology";
import type { CreateMethodologySpec } from "../dto/CreateMethodologyDTO";
import type { Result } from "../../domain/shared/Result";

/**
 * Caso de uso: "criar uma nova metodologia" a partir de uma especificação
 * simples (ids de critério + peso), sem que quem chama precise conhecer
 * `MethodologyBuilder`. É o caminho pensado para uma futura tela de
 * administração compor metodologias — hoje sem UI, mas já com o
 * contrato de aplicação pronto.
 */
export class CreateMethodologyUseCase {
  execute(spec: CreateMethodologySpec): Result<Methodology> {
    const builder = MethodologyBuilder.create().withId(spec.id).withName(spec.name);

    for (const criterion of spec.criteria) {
      builder.addCriterion(criterion.criterionId, criterion.weight, criterion.enabled ?? true);
    }

    if (spec.classification) builder.withClassification(spec.classification);
    if (spec.aggregation) builder.withAggregation(spec.aggregation);
    for (const override of spec.categoryOverrides ?? []) {
      builder.withCategoryOverride(override);
    }
    if (spec.normalizeWeights) builder.normalizeWeights();

    return builder.tryBuild();
  }
}
