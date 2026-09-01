/**
 * Rótulo/selo de cada faixa de classificação — espelha
 * `ClassificationSystem.default()` (Core Domain,
 * `packages/core/src/domain/classification/ClassificationSystem.ts`).
 * Puramente de apresentação: se uma metodologia definir faixas
 * customizadas no futuro, isto deixa de ser 1:1, mas por ora é a mesma
 * fonte da verdade usada em todo o cálculo real.
 */
export const CLASSIFICATION_LABELS: Record<string, string> = {
  EXCELLENT: "Excelente",
  GOOD: "Bom",
  AVERAGE: "Regular",
  POOR: "Fraco",
  NOT_RECOMMENDED: "Não recomendado",
};

export type BadgeVariant = "success" | "warning" | "danger" | "default";

export const CLASSIFICATION_BADGE_VARIANT: Record<string, BadgeVariant> = {
  EXCELLENT: "success",
  GOOD: "success",
  AVERAGE: "warning",
  POOR: "danger",
  NOT_RECOMMENDED: "danger",
};

export function classificationLabel(tier: string): string {
  return CLASSIFICATION_LABELS[tier] ?? tier;
}

export function classificationBadgeVariant(tier: string): BadgeVariant {
  return CLASSIFICATION_BADGE_VARIANT[tier] ?? "default";
}
