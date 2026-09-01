import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils/format";
import { classificationBadgeVariant, classificationLabel } from "../lib/classification";
import type { IndexResultDTO } from "../types";

export function ScoreHistoryList({ history }: { history: readonly IndexResultDTO[] }) {
  if (history.length === 0) {
    return (
      <p className="text-text-muted text-sm">
        Ainda não há histórico de avaliações para este produto.
      </p>
    );
  }

  return (
    <ol className="border-border flex flex-col divide-y divide-(--color-border) rounded-lg border">
      {history.map((entry, index) => (
        <li
          key={`${entry.calculatedAt}-${index}`}
          className="flex items-center justify-between gap-4 p-4"
        >
          <div>
            <p className="text-text text-sm font-medium">{formatDate(entry.calculatedAt)}</p>
            <p className="text-text-muted text-xs">Metodologia v{entry.methodologyVersion}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text text-sm font-semibold tabular-nums">
              {entry.finalScore.toFixed(1)}
            </span>
            <Badge variant={classificationBadgeVariant(entry.classificationTier)}>
              {classificationLabel(entry.classificationTier)}
            </Badge>
          </div>
        </li>
      ))}
    </ol>
  );
}
