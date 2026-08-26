import { EvaluationContext } from "./EvaluationContext";
import {
  FactKeys,
  type CompositionFacts,
  type PricingFacts,
  type LabelFacts,
  type ReputationFacts,
  type MarketingClaimsFacts,
  type StoreFacts,
} from "./Facts";

/**
 * Camada tipada sobre `EvaluationContext.from`. Usar o builder em vez de
 * montar o Record na mão evita erro de digitação nas chaves e documenta,
 * via autocomplete, quais fatos os critérios embutidos esperam.
 */
export class EvaluationContextBuilder {
  private readonly facts: Record<string, unknown> = {};

  withComposition(facts: CompositionFacts): this {
    this.facts[FactKeys.COMPOSITION] = facts;
    return this;
  }

  withPricing(facts: PricingFacts): this {
    this.facts[FactKeys.PRICING] = facts;
    return this;
  }

  withLabel(facts: LabelFacts): this {
    this.facts[FactKeys.LABEL] = facts;
    return this;
  }

  withReputation(facts: ReputationFacts): this {
    this.facts[FactKeys.REPUTATION] = facts;
    return this;
  }

  withMarketingClaims(facts: MarketingClaimsFacts): this {
    this.facts[FactKeys.MARKETING_CLAIMS] = facts;
    return this;
  }

  withStore(facts: StoreFacts): this {
    this.facts[FactKeys.STORE] = facts;
    return this;
  }

  /** Escape hatch para fatos de critérios futuros, sem exigir mudança neste arquivo. */
  withCustomFact(key: string, value: unknown): this {
    this.facts[key] = value;
    return this;
  }

  build(): EvaluationContext {
    return EvaluationContext.from(this.facts);
  }
}
