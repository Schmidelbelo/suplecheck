/**
 * Pesos do Score Geral — nunca hardcoded dentro do cálculo em si
 * (`OverallScoreCalculator.ts`), sempre passados como parâmetro com
 * este objeto como valor-padrão. Trocar a ponderação é editar este
 * arquivo (ou passar um objeto diferente na chamada), nunca mexer na
 * lógica de cálculo.
 *
 * Interpretação de cada peso: quanto o fator pesa no Score Geral
 * (0–100) que combina qualidade (Índice SupleCheck já calculado pela
 * metodologia) com sinais de preço dentro da categoria comparada.
 */
export interface OverallScoreWeights {
  /** Peso do Índice SupleCheck (qualidade) já calculado pela metodologia vigente. */
  readonly quality: number;
  /** Peso do preço absoluto do produto, comparado aos demais da mesma categoria. */
  readonly price: number;
  /** Peso do preço por dose, comparado aos demais da mesma categoria. */
  readonly pricePerDose: number;
  /** Peso do preço por grama, comparado aos demais da mesma categoria (omitido do cálculo quando nenhum produto do conjunto tem dado suficiente para computá-lo). */
  readonly pricePerGram: number;
}

export const DEFAULT_OVERALL_SCORE_WEIGHTS: OverallScoreWeights = {
  quality: 0.4,
  price: 0.2,
  pricePerDose: 0.25,
  pricePerGram: 0.15,
};
