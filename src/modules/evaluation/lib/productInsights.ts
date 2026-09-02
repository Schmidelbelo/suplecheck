import type { CriterionBreakdownDTO, IndexResultDTO } from "@application/index";
import { criterionLabel } from "./criteria";

/**
 * Toda função aqui é pura e determinística sobre dados já persistidos
 * (`IndexResultDTO`) — nunca texto editorial digitado à mão por
 * critério. Isso é deliberado: qualquer frase gerada aqui precisa
 * continuar verdadeira automaticamente se a nota do produto mudar
 * (reavaliação), sem exigir alguém reescrevendo copy manualmente.
 */

const STRONG_THRESHOLD = 75;
const WEAK_THRESHOLD = 45;

function weightedImpact(item: CriterionBreakdownDTO): number {
  return item.weight * item.score;
}

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
 * Sem `score` (produto não avaliado ainda), retorna `null` — o
 * componente decide o que mostrar nesse caso, não este helper.
 */
export function buildProductSummary(score: IndexResultDTO): ProductSummary {
  const sorted = [...score.breakdown].sort((a, b) => weightedImpact(b) - weightedImpact(a));
  const strongest = sorted.filter((c) => c.score >= STRONG_THRESHOLD);
  const weakest = [...score.breakdown]
    .filter((c) => c.score < WEAK_THRESHOLD)
    .sort((a, b) => a.score - b.score);
  const topCriterion = sorted[0];
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

export interface HighlightBadge {
  readonly label: string;
  readonly criterionId: string;
}

/**
 * Badges automáticos — só existem para os 6 critérios reais da
 * metodologia (ver `packages/core/src/domain/criteria/builtin`).
 * Deliberadamente NÃO inclui badges como "Alta concentração", "Boa
 * solubilidade", "Excelente sabor" ou "Boa pureza": nenhum desses dados
 * é capturado em nenhum lugar do domínio (a plataforma nunca testa
 * laboratorialmente um produto) — inventar esse selo seria uma
 * alegação falsa sobre o produto, o oposto do que o Índice SupleCheck
 * se propõe a ser.
 */
const BADGE_LABELS: Record<string, string> = {
  "cost-benefit": "Melhor custo-benefício",
  "label-transparency": "Rótulo transparente",
  reputation: "Muito bem avaliado",
  "store-reliability": "Loja confiável",
  "exaggerated-claims": "Marketing honesto",
  "price-per-dose": "Ótimo preço por dose",
};

export function buildHighlightBadges(score: IndexResultDTO): HighlightBadge[] {
  return score.breakdown
    .filter((c) => c.score >= STRONG_THRESHOLD && BADGE_LABELS[c.criterionId])
    .sort((a, b) => weightedImpact(b) - weightedImpact(a))
    .slice(0, 3)
    .map((c) => ({ label: BADGE_LABELS[c.criterionId]!, criterionId: c.criterionId }));
}

/** Faixa de cor por nota — reaproveitada pela barra de progresso e pelo texto de cada critério. */
export type ScoreBand = "strong" | "average" | "weak";

export function scoreBand(value: number): ScoreBand {
  if (value >= STRONG_THRESHOLD) return "strong";
  if (value >= WEAK_THRESHOLD) return "average";
  return "weak";
}
