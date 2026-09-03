import type { IndexResultDTO } from "@application/index";
import { rankCriteriaByImpact } from "@core/index";
import { criterionLabel } from "./criteria";

/**
 * Toda função aqui é pura e determinística sobre dados já persistidos
 * (`IndexResultDTO`) — nunca texto editorial digitado à mão por
 * critério. Isso é deliberado: qualquer frase gerada aqui precisa
 * continuar verdadeira automaticamente se a nota do produto mudar
 * (reavaliação), sem exigir alguém reescrevendo copy manualmente.
 *
 * A ordenação por impacto real (nota × peso) vem de
 * `rankCriteriaByImpact` (Core Domain) — nunca recalculada aqui (ver
 * docs/SCORING.md, "eliminação de duplicação").
 */

const STRONG_THRESHOLD = 75;
const WEAK_THRESHOLD = 45;

export interface ProductSummary {
  readonly audience: string;
  readonly pros: readonly string[];
  readonly cons: readonly string[];
  readonly buyIf: string;
  readonly skipIf: string | null;
}

/**
 * Resumo "Em resumo" — construído inteiramente a partir de
 * `breakdown`/`classificationTier` já calculados pelo Core Domain.
 */
export function buildProductSummary(score: IndexResultDTO): ProductSummary {
  const ranked = rankCriteriaByImpact(score.breakdown);
  const strongest = ranked.filter((c) => c.score >= STRONG_THRESHOLD);
  const weakest = [...ranked]
    .filter((c) => c.score < WEAK_THRESHOLD)
    .sort((a, b) => a.score - b.score);
  const topCriterion = ranked[0];
  const worstCriterion = weakest[0];

  const pros = strongest
    .slice(0, 3)
    .map((c) => `${criterionLabel(c.criterionId)} (nota ${c.score.toFixed(0)})`);

  const cons: string[] = weakest
    .slice(0, 2)
    .map((c) => `${criterionLabel(c.criterionId)} (nota ${c.score.toFixed(0)})`);

  // Alertas de validação (flags) são o sinal mais forte que o Core
  // Domain expõe — texto do próprio domínio, nunca reescrito aqui.
  for (const item of score.breakdown) {
    for (const flag of item.flags) {
      if (!cons.includes(flag.message)) cons.push(flag.message);
    }
  }

  const audience = topCriterion
    ? `Quem valoriza ${criterionLabel(topCriterion.criterionId).toLowerCase()} acima de tudo.`
    : "Quem busca uma opção avaliada de forma independente.";

  const buyIf = topCriterion
    ? `Vale a compra se ${criterionLabel(topCriterion.criterionId).toLowerCase()} for prioridade para você — foi o critério que mais pesou na nota final (${score.finalScore.toFixed(1)}).`
    : `Nota final ${score.finalScore.toFixed(1)} de 100.`;

  const skipIf = worstCriterion
    ? `Considere alternativas se ${criterionLabel(worstCriterion.criterionId).toLowerCase()} for essencial para você — foi o ponto mais fraco (nota ${worstCriterion.score.toFixed(0)}).`
    : null;

  return { audience, pros, cons, buyIf, skipIf };
}

/** Faixa de cor por nota — reaproveitada pela barra de progresso e pelo texto de cada critério. */
export type ScoreBand = "strong" | "average" | "weak";

export function scoreBand(value: number): ScoreBand {
  if (value >= STRONG_THRESHOLD) return "strong";
  if (value >= WEAK_THRESHOLD) return "average";
  return "weak";
}
