import { TrendingUp, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { computePriceStats } from "../services/price.service";
import { buildPriceBadges, buildPriceInsights } from "../lib/priceInsights";
import { PriceHistoryChart, PriceStatsSummary, type PriceHistoryPoint } from "./PriceHistoryChart";
import { PriceAlertForm } from "./PriceAlertForm";

/**
 * Seção completa de inteligência de preço — a maior parte é Server
 * Component puro; só `PriceAlertForm` (dentro) é client, por depender
 * de `localStorage`.  Com menos de 2 capturas, mostra um estado vazio
 * elegante em vez de um gráfico vazio ou enganoso ("Aguardando
 * histórico de preços").
 */
export function PriceIntelligenceSection({
  points,
  goodQuality,
  productId,
  slug,
  productName,
}: {
  points: readonly PriceHistoryPoint[];
  goodQuality: boolean;
  productId: string;
  slug: string;
  productName: string;
}) {
  const stats = computePriceStats(points);
  if (!stats) return null;

  const badges = buildPriceBadges(stats, goodQuality);
  const insights = buildPriceInsights(stats);

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-text flex items-center gap-2 text-lg font-bold">
            <TrendingUp className="size-4" aria-hidden />
            Inteligência de preço
          </h3>
          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <Badge key={badge.label} variant="brand" className="gap-1">
                  <span aria-hidden>{badge.emoji}</span>
                  {badge.label}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        {points.length < 2 ? (
          <div className="border-border flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
            <Clock className="text-text-subtle size-6" aria-hidden />
            <p className="text-text-muted text-sm">Aguardando histórico de preços.</p>
            <p className="text-text-subtle max-w-sm text-xs">
              Este produto tem só uma captura de preço até agora. Assim que houver uma segunda, o
              gráfico de evolução aparece aqui automaticamente.
            </p>
          </div>
        ) : (
          <PriceHistoryChart points={points} />
        )}

        <PriceStatsSummary stats={stats} />

        <div className="border-border flex flex-col gap-2 border-t pt-4">
          <p className="text-text-muted text-xs font-semibold tracking-wide uppercase">
            Análise inteligente
          </p>
          <ul className="flex flex-col gap-1.5">
            {insights.map((insight) => (
              <li key={insight} className="text-text-muted text-sm">
                {insight}
              </li>
            ))}
          </ul>
        </div>

        <PriceAlertForm
          productId={productId}
          slug={slug}
          productName={productName}
          currentCents={stats.currentCents}
          minCents={stats.minCents}
        />
      </CardContent>
    </Card>
  );
}
