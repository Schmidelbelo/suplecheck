import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrencyBRL } from "@/lib/utils/format";
import { MarketInsightsList } from "./MarketInsightsList";
import type { CategoryMarketViewResponse } from "@/modules/market/types";

function DistributionBar({ label, count, total }: { label: string; count: number; total: number }) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">{label}</span>
        <span className="text-text-muted tabular-nums">
          {count} produto{count === 1 ? "" : "s"}
        </span>
      </div>
      <div
        className="bg-bg-muted h-1.5 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="bg-brand h-full rounded-full" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

/** Estatísticas reais da categoria — distribuição de notas/preços, média, mediana e desvio padrão simples, calculados a partir das avaliações mais recentes de cada produto. */
export function CategoryStatisticsSection({ view }: { view: CategoryMarketViewResponse }) {
  const { statistics, insights } = view;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-1 p-5">
            <p className="text-text-muted text-xs font-semibold tracking-wide uppercase">
              Média da categoria
            </p>
            <p className="text-text text-2xl font-bold">{statistics.averageScore.toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 p-5">
            <p className="text-text-muted text-xs font-semibold tracking-wide uppercase">Mediana</p>
            <p className="text-text text-2xl font-bold">{statistics.medianScore.toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1 p-5">
            <p className="text-text-muted text-xs font-semibold tracking-wide uppercase">
              Desvio padrão
            </p>
            <p className="text-text text-2xl font-bold">
              {statistics.scoreStandardDeviation.toFixed(1)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <p className="text-text text-sm font-semibold">Distribuição dos Scores</p>
          <div className="flex flex-col gap-3">
            {statistics.scoreDistribution.map((bucket) => (
              <DistributionBar
                key={`${bucket.minScore}-${bucket.maxScore}`}
                label={`${bucket.minScore}–${bucket.maxScore}`}
                count={bucket.count}
                total={statistics.productCount}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {statistics.priceDistribution.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
              <p className="text-text text-sm font-semibold">Distribuição de preços</p>
              {statistics.predominantPriceRange ? (
                <p className="text-text-muted text-xs">
                  Faixa predominante: {formatCurrencyBRL(statistics.predominantPriceRange.minCents)}{" "}
                  – {formatCurrencyBRL(statistics.predominantPriceRange.maxCents)}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-3">
              {statistics.priceDistribution.map((bucket) => (
                <DistributionBar
                  key={`${bucket.minCents}-${bucket.maxCents}`}
                  label={`${formatCurrencyBRL(bucket.minCents)} – ${formatCurrencyBRL(bucket.maxCents)}`}
                  count={bucket.count}
                  total={statistics.productCount}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <MarketInsightsList insights={insights} />
    </div>
  );
}
