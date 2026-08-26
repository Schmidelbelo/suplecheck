import type { Score } from "../value-objects/Score";

/**
 * Uma faixa de classificação (ex: "Excelente" para nota ≥ 85). O limite
 * inferior é inclusivo. Nada aqui é hardcoded no motor de cálculo — as
 * faixas são dados de configuração de uma `ClassificationSystem`.
 */
export class ClassificationBand {
  private constructor(
    public readonly tier: string,
    public readonly minScore: Score,
    public readonly label: string,
    public readonly description: string,
  ) {}

  static of(tier: string, minScore: Score, label: string, description: string): ClassificationBand {
    if (!tier.trim() || !label.trim()) {
      throw new Error("ClassificationBand requer tier e label não vazios.");
    }
    return new ClassificationBand(tier, minScore, label, description);
  }

  includes(score: Score): boolean {
    return score.isAtLeast(this.minScore);
  }
}
