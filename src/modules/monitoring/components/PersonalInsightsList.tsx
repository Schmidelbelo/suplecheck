import { Lightbulb } from "lucide-react";

/** Frases geradas por `generatePersonalInsights` — só dado real local, nunca inferido. */
export function PersonalInsightsList({ insights }: { insights: readonly string[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="bg-brand-subtle flex flex-col gap-2 rounded-lg p-4">
      {insights.map((insight) => (
        <p key={insight} className="text-text flex items-start gap-2 text-sm">
          <Lightbulb className="text-brand mt-0.5 size-4 shrink-0" aria-hidden />
          {insight}
        </p>
      ))}
    </div>
  );
}
