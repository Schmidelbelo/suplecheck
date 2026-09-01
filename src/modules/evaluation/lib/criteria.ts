/**
 * Nome legível de cada critério embutido — espelha
 * `packages/core/src/domain/criteria/builtin/*.ts` (a fonte real de
 * comportamento; isto é só o rótulo de apresentação, nunca a lógica).
 */
export const CRITERION_LABELS: Record<string, string> = {
  "cost-benefit": "Custo-benefício",
  "price-per-dose": "Preço por dose",
  "label-transparency": "Transparência do rótulo",
  reputation: "Reputação",
  "exaggerated-claims": "Promessas exageradas",
  "store-reliability": "Confiabilidade da loja",
};

export function criterionLabel(criterionId: string): string {
  return CRITERION_LABELS[criterionId] ?? criterionId;
}
