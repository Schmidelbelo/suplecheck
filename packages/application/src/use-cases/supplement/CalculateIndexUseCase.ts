import {
  MethodologyResolver,
  ScoringEngine,
  type EvaluationContext,
  type Methodology,
  type SupplementProfile,
} from "../../domain-kernel";
import type { UseCase } from "../../shared/UseCase";
import type { IndexResultDTO } from "../../dto/IndexResultDTO";
import type { CriterionCatalogPort } from "../../ports/CriterionCatalogPort";
import { IndexResultMapper } from "../../mappers/IndexResultMapper";

export interface CalculateIndexRequest {
  readonly supplement: SupplementProfile;
  readonly methodology: Methodology;
  readonly context: EvaluationContext;
}

/**
 * Primitivo de cálculo: dado um suplemento, uma metodologia (já
 * resolvida/carregada) e um contexto de avaliação, produz o Índice.
 * Não persiste nada, não registra auditoria — é só a ponte fina até
 * `MethodologyResolver` + `ScoringEngine` do Domain, mapeada para DTO na
 * saída. `EvaluateSupplementUseCase` é quem orquestra tudo em volta
 * (buscar dados, persistir, auditar) chamando este Use Case no meio.
 */
export class CalculateIndexUseCase implements UseCase<CalculateIndexRequest, IndexResultDTO> {
  constructor(private readonly criteria: CriterionCatalogPort) {}

  async execute(request: CalculateIndexRequest): Promise<IndexResultDTO> {
    const registry = await this.criteria.loadRegistry();
    const resolved = MethodologyResolver.resolve(
      request.methodology,
      request.supplement.categorySlug,
    );
    const engine = new ScoringEngine(registry);
    const result = engine.calculate(request.supplement.id, resolved, request.context);
    return IndexResultMapper.toDTO(result);
  }
}
