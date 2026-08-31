import type {
  CompositionFacts,
  PricingFacts,
  LabelFacts,
  ReputationFacts,
  MarketingClaimsFacts,
  StoreFacts,
} from "../domain-kernel";

export interface RegisterSupplementCommand {
  readonly slug: string;
  readonly name: string;
  readonly categorySlug: string;
  readonly brandSlug: string;
  readonly attributes?: Readonly<Record<string, unknown>>;
}

export interface UpdateSupplementCommand {
  readonly id: string;
  readonly name?: string;
  readonly attributes?: Readonly<Record<string, unknown>>;
}

/**
 * Fatos brutos de avaliação, no formato aceito por
 * `EvaluationContextFactory`. Reaproveita literalmente os tipos de fato
 * do Domain (`CompositionFacts`, `PricingFacts`, ...) em vez de duplicar
 * a forma — evita os dois divergirem silenciosamente.
 */
export interface EvaluateSupplementCommand {
  readonly supplementId: string;
  readonly methodologyId?: string; // se omitido, usa a metodologia ativa da categoria do suplemento
  readonly facts: {
    readonly composition?: CompositionFacts;
    readonly pricing?: PricingFacts;
    readonly label?: LabelFacts;
    readonly reputation?: ReputationFacts;
    readonly marketingClaims?: MarketingClaimsFacts;
    readonly store?: StoreFacts;
  };
}
