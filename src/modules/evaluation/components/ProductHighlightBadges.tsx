import { Award } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buildHighlightBadges } from "../lib/productInsights";
import type { IndexResultDTO } from "../types";

/** Server Component puro — badges derivados de `breakdown`, sem JS extra no cliente. */
export function ProductHighlightBadges({ score }: { score: IndexResultDTO }) {
  const badges = buildHighlightBadges(score);
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <Badge key={badge.criterionId} variant="brand" className="gap-1">
          <Award className="size-3" aria-hidden />
          {badge.label}
        </Badge>
      ))}
    </div>
  );
}
