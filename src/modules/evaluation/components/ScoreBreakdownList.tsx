import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { criterionLabel } from "../lib/criteria";
import { scoreBand, type ScoreBand } from "../lib/productInsights";
import type { IndexResultDTO } from "../types";

const BAND_BAR_CLASS: Record<ScoreBand, string> = {
  strong: "bg-success",
  average: "bg-warning",
  weak: "bg-danger",
};

const BAND_TEXT_CLASS: Record<ScoreBand, string> = {
  strong: "text-success",
  average: "text-warning",
  weak: "text-danger",
};

/** Frase curta e determinística — nunca copy editorial, só descreve o dado que já existe. */
function shortExplanation(item: IndexResultDTO["breakdown"][number]): string {
  if (item.notes[0]) return item.notes[0].message;
  const band = scoreBand(item.score);
  if (band === "strong") return "Ponto forte deste produto nesta avaliação.";
  if (band === "weak") return "Ponto de atenção nesta avaliação.";
  return "Dentro da média nesta avaliação.";
}

export function ScoreBreakdownList({ breakdown }: { breakdown: IndexResultDTO["breakdown"] }) {
  const sorted = [...breakdown].sort((a, b) => b.weight - a.weight);
  const byScore = [...breakdown].sort((a, b) => b.score - a.score);
  const bestId =
    byScore[0]?.score !== byScore[byScore.length - 1]?.score ? byScore[0]?.criterionId : undefined;
  const worstId =
    byScore.length > 1 && byScore[0]?.score !== byScore[byScore.length - 1]?.score
      ? byScore[byScore.length - 1]?.criterionId
      : undefined;

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((item) => {
        const band = scoreBand(item.score);
        const isBest = item.criterionId === bestId;
        const isWorst = item.criterionId === worstId;

        return (
          <Card key={item.criterionId}>
            <CardContent className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <p className="text-text text-sm font-semibold">
                    {criterionLabel(item.criterionId)}
                  </p>
                  {isBest ? (
                    <Badge variant="success" className="gap-1">
                      <TrendingUp className="size-3" aria-hidden />
                      Ponto forte
                    </Badge>
                  ) : null}
                  {isWorst ? (
                    <Badge variant="danger" className="gap-1">
                      <TrendingDown className="size-3" aria-hidden />
                      Ponto fraco
                    </Badge>
                  ) : null}
                </div>
                <span className={cn("text-lg font-bold tabular-nums", BAND_TEXT_CLASS[band])}>
                  {item.score.toFixed(1)}
                </span>
              </div>

              <p className="text-text-muted text-xs">
                Peso na nota final: {(item.weight * 100).toFixed(0)}%
              </p>

              <div
                className="bg-bg-muted h-1.5 w-full overflow-hidden rounded-full"
                role="progressbar"
                aria-valuenow={Math.round(item.score)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Nota de ${criterionLabel(item.criterionId)}`}
              >
                <div
                  className={cn("h-full rounded-full transition-all", BAND_BAR_CLASS[band])}
                  style={{ width: `${Math.max(0, Math.min(100, item.score))}%` }}
                />
              </div>

              <p className="text-text-muted text-xs">{shortExplanation(item)}</p>

              {item.notes.length > 1 ? (
                <ul className="text-text-muted flex flex-col gap-0.5 text-xs">
                  {item.notes.slice(1).map((note, index) => (
                    <li key={index}>{note.message}</li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
