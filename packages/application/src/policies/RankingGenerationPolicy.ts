import { PolicyViolationError } from "../errors/ApplicationError";

/**
 * Um ranking com poucos produtos avaliados é mais ruído que sinal —
 * exige um mínimo de suplementos com Índice calculado antes de publicar
 * um ranking de categoria. Limite deliberadamente baixo (1) hoje: a Fase
 * 0 começa com 10 creatinas, mas a política já existe para ser
 * apertada por configuração quando fizer sentido de produto, sem
 * precisar tocar em `GenerateRankingUseCase`.
 */
export class RankingGenerationPolicy {
  constructor(private readonly minimumEvaluatedSupplements: number = 1) {}

  assertCanGenerate(categorySlug: string, evaluatedCount: number): void {
    if (evaluatedCount < this.minimumEvaluatedSupplements) {
      throw new PolicyViolationError(
        "RankingGenerationPolicy",
        `categoria "${categorySlug}" tem apenas ${evaluatedCount} suplemento(s) avaliado(s); mínimo exigido é ${this.minimumEvaluatedSupplements}.`,
      );
    }
  }
}
