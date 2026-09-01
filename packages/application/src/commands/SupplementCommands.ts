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
  readonly description?: string;
  readonly categorySlug: string;
  readonly brandSlug: string;
  readonly manufacturerSlug?: string;
  readonly attributes?: Readonly<Record<string, unknown>>;
}

export interface UpdateSupplementCommand {
  readonly id: string;
  readonly name?: string;
  readonly description?: string;
  readonly manufacturerSlug?: string;
  readonly attributes?: Readonly<Record<string, unknown>>;
}

export type ProductStatusCommandValue =
  "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "UNPUBLISHED" | "ARCHIVED";

/** Transição de status é um comando próprio (não um campo solto de Update) — cada mudança gera sua própria entrada de auditoria com o motivo explícito. */
export interface SetSupplementStatusCommand {
  readonly id: string;
  readonly status: ProductStatusCommandValue;
}

/** Soft delete de um Suplemento = transição para ARCHIVED (Domain Model §3.1) — nunca remove a linha. */
export interface DeleteSupplementCommand {
  readonly id: string;
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
