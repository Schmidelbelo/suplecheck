/**
 * Fatos "conhecidos" — os seis critérios embutidos (ver `criteria/builtin`)
 * dependem destes formatos. Um critério novo NÃO precisa de uma entrada
 * aqui: pode ler qualquer chave própria via `EvaluationContext.get` e
 * `EvaluationContextBuilder.withCustomFact`. Este arquivo existe apenas
 * para dar segurança de tipos aos fatos que o domínio já conhece.
 */
export const FactKeys = {
  COMPOSITION: "composition",
  PRICING: "pricing",
  LABEL: "label",
  REPUTATION: "reputation",
  MARKETING_CLAIMS: "marketingClaims",
  STORE: "store",
} as const;

export type FactKey = (typeof FactKeys)[keyof typeof FactKeys];

export interface NumericRange {
  min: number;
  max: number;
}

export interface CompositionFacts {
  /** Quantidade do princípio ativo por porção, na unidade de referência da categoria (ex: mg). */
  activeIngredientAmountPerServing: number;
  /** Faixa de referência (literatura científica) para a mesma unidade. */
  referenceRangePerServing: NumericRange;
  additives: string[];
  undisclosedSubstances: string[];
}

export interface PricingFacts {
  priceInCents: number;
  dosesPerUnit: number;
  /** Preço médio por dose entre concorrentes diretos da mesma categoria, se conhecido. */
  categoryAveragePricePerDoseInCents?: number;
}

export interface LabelFacts {
  hasProprietaryBlend: boolean;
  nutritionalInfoComplete: boolean;
  dosageClearlyStated: boolean;
}

export interface ReputationFacts {
  averageRating: number; // 0–5
  reviewCount: number;
}

export interface MarketingClaimsFacts {
  claims: string[];
  scientificallySupportedClaims: string[];
}

export interface StoreFacts {
  /** Nota de confiabilidade da loja, já em escala 0–100 (histórico de reclamações, tempo de mercado etc.). */
  trustScore: number;
  hasBuyerProtection: boolean;
}
