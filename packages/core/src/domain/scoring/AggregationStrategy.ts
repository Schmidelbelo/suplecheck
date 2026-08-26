import { Score } from "../value-objects/Score";
import type { Weight } from "../value-objects/Weight";

export interface WeightedScore {
  readonly score: Score;
  readonly weight: Weight;
}

/**
 * Estratégia de combinação de notas ponderadas em uma nota final. Trocar
 * a estratégia (nova metodologia, novo comportamento matemático) nunca
 * exige alterar `ScoringEngine` nem `CompositeCriterion` — ambos
 * dependem apenas desta interface (Strategy Pattern).
 */
export interface AggregationStrategy {
  readonly name: string;
  aggregate(items: readonly WeightedScore[]): Score;
}

/** Padrão do domínio: média ponderada simples. */
export class WeightedAverageAggregationStrategy implements AggregationStrategy {
  readonly name = "weighted-average";

  aggregate(items: readonly WeightedScore[]): Score {
    if (items.length === 0) {
      return Score.min();
    }
    const totalWeight = items.reduce((sum, item) => sum + item.weight.value, 0);
    if (totalWeight === 0) {
      return Score.min();
    }
    const weightedSum = items.reduce((sum, item) => sum + item.score.value * item.weight.value, 0);
    return Score.of(weightedSum / totalWeight);
  }
}

/**
 * Estratégia alternativa: a nota final nunca pode superar a menor nota
 * ponderada relevante (pune fortemente um único critério muito ruim).
 * Existe principalmente para provar que o motor é aberto a novas
 * estratégias sem alteração de código (Open/Closed).
 */
export class WorstCriterionCappedAggregationStrategy implements AggregationStrategy {
  readonly name = "worst-criterion-capped";
  private readonly base = new WeightedAverageAggregationStrategy();

  aggregate(items: readonly WeightedScore[]): Score {
    if (items.length === 0) {
      return Score.min();
    }
    const average = this.base.aggregate(items);
    const worst = items.reduce(
      (min, item) => (item.score.value < min.value ? item.score : min),
      items[0]!.score,
    );
    return Score.of(Math.min(average.value, worst.value + (100 - worst.value) * 0.3));
  }
}
