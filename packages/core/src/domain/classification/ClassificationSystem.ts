import { ClassificationBand } from "./ClassificationBand";
import { Score } from "../value-objects/Score";

/**
 * Conjunto ordenado de faixas que traduz uma `Score` final em um rótulo
 * legível ("Excelente", "Bom", ...). Cada `Methodology` carrega a sua
 * própria `ClassificationSystem` — trocar os limites, nomear faixas de
 * outro jeito ou até mudar quantas faixas existem não exige alterar o
 * `ScoringEngine`.
 */
export class ClassificationSystem {
  private readonly bands: readonly ClassificationBand[];

  private constructor(bands: readonly ClassificationBand[]) {
    this.bands = bands;
  }

  static of(bands: readonly ClassificationBand[]): ClassificationSystem {
    if (bands.length === 0) {
      throw new Error("ClassificationSystem requer ao menos uma faixa.");
    }
    const sorted = [...bands].sort((a, b) => b.minScore.value - a.minScore.value);
    return new ClassificationSystem(sorted);
  }

  /** Faixas padrão da plataforma — ponto de partida, não uma regra fixa. */
  static default(): ClassificationSystem {
    return ClassificationSystem.of([
      ClassificationBand.of("EXCELLENT", Score.of(85), "Excelente", "Referência na categoria."),
      ClassificationBand.of("GOOD", Score.of(70), "Bom", "Acima da média, poucas ressalvas."),
      ClassificationBand.of(
        "AVERAGE",
        Score.of(50),
        "Regular",
        "Cumpre o básico, com ressalvas relevantes.",
      ),
      ClassificationBand.of("POOR", Score.of(30), "Fraco", "Diversos pontos de atenção."),
      ClassificationBand.of(
        "NOT_RECOMMENDED",
        Score.min(),
        "Não recomendado",
        "Falhas graves identificadas.",
      ),
    ]);
  }

  classify(score: Score): ClassificationBand {
    const band = this.bands.find((candidate) => candidate.includes(score));
    // Garantido pelo invariante: a última faixa tem minScore = 0, então sempre há match.
    return band ?? this.bands[this.bands.length - 1]!;
  }
}
