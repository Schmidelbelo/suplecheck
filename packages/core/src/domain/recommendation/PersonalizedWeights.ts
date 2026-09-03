/**
 * Prioridade escolhida pelo usuário no Assistente de Escolha — o único
 * dado do perfil que realmente altera pontuação (idade, sexo, nível de
 * treino e frequência semanal são coletados só para futura segmentação;
 * nenhum critério real do domínio os relaciona a qualidade/preço hoje,
 * então nunca entram em nenhum cálculo).
 */
export type RecommendationPriority =
  "economy" | "quality" | "bestRating" | "transparency" | "costBenefit";

export interface PersonalizedWeights {
  /** Peso do Índice SupleCheck (nota geral da metodologia). */
  readonly quality: number;
  readonly price: number;
  readonly pricePerDose: number;
  readonly pricePerGram: number;
  /** Peso do critério real "Transparência do rótulo" (`label-transparency`). */
  readonly transparency: number;
}

/**
 * Um perfil de pesos por prioridade — constantes explícitas e
 * documentadas, no mesmo espírito de `DEFAULT_OVERALL_SCORE_WEIGHTS`:
 * parâmetros do algoritmo, nunca dado fabricado. Devolvidos na resposta
 * da API (`weightsUsed`) para que a recomendação seja auditável.
 */
export const PERSONALIZED_WEIGHTS_BY_PRIORITY: Record<RecommendationPriority, PersonalizedWeights> =
  {
    economy: {
      quality: 0.2,
      price: 0.35,
      pricePerDose: 0.3,
      pricePerGram: 0.1,
      transparency: 0.05,
    },
    quality: {
      quality: 0.55,
      price: 0.1,
      pricePerDose: 0.1,
      pricePerGram: 0.05,
      transparency: 0.2,
    },
    bestRating: {
      quality: 0.75,
      price: 0.05,
      pricePerDose: 0.05,
      pricePerGram: 0.05,
      transparency: 0.1,
    },
    transparency: {
      quality: 0.25,
      price: 0.1,
      pricePerDose: 0.1,
      pricePerGram: 0.05,
      transparency: 0.5,
    },
    costBenefit: {
      quality: 0.3,
      price: 0.2,
      pricePerDose: 0.25,
      pricePerGram: 0.15,
      transparency: 0.1,
    },
  };

export function resolvePersonalizedWeights(priority: RecommendationPriority): PersonalizedWeights {
  return PERSONALIZED_WEIGHTS_BY_PRIORITY[priority];
}
