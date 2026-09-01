import { Card, CardContent } from "@/components/ui/Card";
import { criterionLabel } from "../lib/criteria";
import type { IndexResultDTO } from "../types";

export function ScoreBreakdownList({ breakdown }: { breakdown: IndexResultDTO["breakdown"] }) {
  const sorted = [...breakdown].sort((a, b) => b.weight - a.weight);

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((item) => (
        <Card key={item.criterionId}>
          <CardContent className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-text text-sm font-semibold">
                  {criterionLabel(item.criterionId)}
                </p>
                <p className="text-text-muted text-xs">
                  Peso na nota final: {(item.weight * 100).toFixed(0)}%
                </p>
              </div>
              <span className="text-text text-lg font-bold tabular-nums">
                {item.score.toFixed(1)}
              </span>
            </div>
            <div className="bg-bg-muted h-1.5 w-full overflow-hidden rounded-full">
              <div
                className="bg-brand h-full rounded-full"
                style={{ width: `${Math.max(0, Math.min(100, item.score))}%` }}
              />
            </div>
            {item.notes.length > 0 ? (
              <ul className="text-text-muted flex flex-col gap-0.5 text-xs">
                {item.notes.map((note, index) => (
                  <li key={index}>{note.message}</li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
