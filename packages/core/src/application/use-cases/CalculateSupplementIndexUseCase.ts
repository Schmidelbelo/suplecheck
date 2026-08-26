import type { CriterionRegistry } from "../../domain/criteria/CriterionRegistry";
import { MethodologyResolver } from "../../domain/methodology/MethodologyResolver";
import { ScoringEngine } from "../../domain/scoring/ScoringEngine";
import type { SupleCheckIndexResult } from "../../domain/scoring/SupleCheckIndexResult";
import type { CalculateSupplementIndexInput } from "../dto/CalculateSupplementIndexDTO";

/**
 * Caso de uso: "calcular o Índice SupleCheck de um suplemento". Ponto de
 * entrada único para quem está fora do domínio (futura camada de
 * infraestrutura/API) — orquestra resolução de metodologia + motor de
 * cálculo sem expor `MethodologyResolver` nem `ScoringEngine`
 * diretamente a quem chama.
 */
export class CalculateSupplementIndexUseCase {
  constructor(private readonly criterionRegistry: CriterionRegistry) {}

  execute(input: CalculateSupplementIndexInput): SupleCheckIndexResult {
    const resolved = MethodologyResolver.resolve(input.methodology, input.supplement.categorySlug);
    const engine = new ScoringEngine(this.criterionRegistry);
    return engine.calculate(input.supplement.id, resolved, input.context);
  }
}
