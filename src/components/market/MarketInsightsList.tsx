import { Sparkles } from "lucide-react";

/** Frases geradas por `generateMarketInsights` (Core Domain) — nunca texto fixo, ver docs/SCORING.md. */
export function MarketInsightsList({ insights }: { insights: readonly string[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="bg-brand-subtle flex flex-col gap-2 rounded-lg p-4">
      {insights.map((insight) => (
        <p key={insight} className="text-text flex items-start gap-2 text-sm">
          <Sparkles className="text-brand mt-0.5 size-4 shrink-0" aria-hidden />
          {insight}
        </p>
      ))}
    </div>
  );
}
