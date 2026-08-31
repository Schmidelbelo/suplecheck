import { EvaluationContextBuilder, type EvaluationContext } from "../domain-kernel";
import type { EvaluateSupplementCommand } from "../commands/SupplementCommands";

/**
 * Traduz os fatos "planos" de um `EvaluateSupplementCommand` (o formato
 * que um formulário de curadoria ou uma importação preenche) para o
 * `EvaluationContext` que o Domain consome. Nenhum outro lugar da
 * Application monta um `EvaluationContext` na mão — sempre por aqui.
 */
export const EvaluationContextFactory = {
  fromCommand(command: EvaluateSupplementCommand): EvaluationContext {
    const builder = new EvaluationContextBuilder();
    const { facts } = command;

    if (facts.composition) builder.withComposition(facts.composition);
    if (facts.pricing) builder.withPricing(facts.pricing);
    if (facts.label) builder.withLabel(facts.label);
    if (facts.reputation) builder.withReputation(facts.reputation);
    if (facts.marketingClaims) builder.withMarketingClaims(facts.marketingClaims);
    if (facts.store) builder.withStore(facts.store);

    return builder.build();
  },
};
