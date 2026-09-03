import type { PriceStats } from "../services/price.service";

export interface PriceBadge {
  readonly emoji: string;
  readonly label: string;
}

const OPPORTUNITY_THRESHOLD_PERCENT = -10; // preço >=10% abaixo da média
const ABOVE_AVERAGE_THRESHOLD_PERCENT = 10; // preço >=10% acima da média

/**
 * Badges automáticos — cada um só aparece quando o dado que o
 * sustenta realmente existe. Em particular, "Menor preço histórico"
 * exige mais de 1 captura: com uma única captura, todo preço é
 * trivialmente "o menor já visto" (não há histórico real nenhum) —
 * mostrar o badge nesse caso seria uma alegação enganosa de que existe
 * um track record provando isso.
 */
export function buildPriceBadges(stats: PriceStats, goodQuality: boolean): PriceBadge[] {
  const badges: PriceBadge[] = [];

  if (stats.capturesCount > 1) {
    if (stats.isAllTimeLow) badges.push({ emoji: "🔥", label: "Menor preço histórico" });
    if (stats.changeDirection === "up") badges.push({ emoji: "📈", label: "Preço subiu" });
    if (stats.changeDirection === "down") badges.push({ emoji: "📉", label: "Preço caiu" });
  }

  if (stats.percentVsAverage <= OPPORTUNITY_THRESHOLD_PERCENT && goodQuality) {
    badges.push({ emoji: "⭐", label: "Melhor oportunidade" });
  } else if (stats.percentVsAverage >= ABOVE_AVERAGE_THRESHOLD_PERCENT) {
    badges.push({ emoji: "⚠️", label: "Preço acima da média" });
  }

  return badges;
}

/**
 * "Análise Inteligente" — frases determinísticas geradas a partir das
 * mesmas estatísticas, nunca texto editorial fixo por produto. Heurísticas
 * simples e explicáveis, não um modelo de previsão.
 */
export function buildPriceInsights(stats: PriceStats): string[] {
  const insights: string[] = [];
  const absPercent = Math.abs(stats.percentVsAverage).toFixed(0);

  if (stats.percentVsAverage <= -5) {
    insights.push(`O preço atual está ${absPercent}% abaixo da média histórica deste produto.`);
  } else if (stats.percentVsAverage >= 5) {
    insights.push(`O preço atual está ${absPercent}% acima da média histórica deste produto.`);
  } else {
    insights.push("O preço atual está próximo da média histórica deste produto.");
  }

  if (stats.capturesCount > 1) {
    if (stats.currentCents > stats.minCents) {
      const diffPercent = (((stats.currentCents - stats.minCents) / stats.minCents) * 100).toFixed(
        0,
      );
      insights.push(
        `Este produto já ficou ${diffPercent}% mais barato do que está agora — pode valer esperar uma nova queda.`,
      );
    } else {
      insights.push("Este é o menor preço já registrado para este produto. Boa oportunidade.");
    }
  } else {
    insights.push(
      "Ainda há só uma captura de preço registrada — sem histórico suficiente para dizer se este é um bom momento para comprar.",
    );
  }

  return insights;
}
