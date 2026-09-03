import { formatCurrencyBRL } from "@/lib/utils/format";
import type { PriceStats } from "../services/price.service";

const CHART_WIDTH = 600;
const CHART_HEIGHT = 160;
const PADDING = 24;

export interface PriceHistoryPoint {
  readonly priceCents: number;
  readonly capturedAt: string;
}

/**
 * Gráfico de evolução de preço — SVG desenhado no servidor, sem
 * biblioteca de gráficos (recharts/chart.js) e sem `"use client"`:
 * poucos pontos não justificam o peso de uma lib inteira no bundle, e
 * um `<polyline>` estático não precisa de nenhuma interatividade real.
 */
export function PriceHistoryChart({ points }: { points: readonly PriceHistoryPoint[] }) {
  if (points.length < 2) return null;

  const prices = points.map((p) => p.priceCents);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const usableWidth = CHART_WIDTH - PADDING * 2;
  const usableHeight = CHART_HEIGHT - PADDING * 2;

  const coords = points.map((point, index) => {
    const x = PADDING + (index / (points.length - 1)) * usableWidth;
    const y = PADDING + usableHeight - ((point.priceCents - min) / range) * usableHeight;
    return { x, y, point };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1]!.x} ${CHART_HEIGHT - PADDING} L ${coords[0]!.x} ${CHART_HEIGHT - PADDING} Z`;
  const last = coords[coords.length - 1]!;

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      role="img"
      aria-label={`Evolução de preço: de ${formatCurrencyBRL(min)} a ${formatCurrencyBRL(max)}, atualmente ${formatCurrencyBRL(prices[prices.length - 1]!)}`}
      className="text-brand w-full"
      preserveAspectRatio="none"
    >
      <path d={areaPath} fill="currentColor" opacity={0.08} />
      <path d={linePath} fill="none" stroke="currentColor" strokeWidth={2} />
      {coords.map((c, index) => (
        <circle
          key={index}
          cx={c.x}
          cy={c.y}
          r={index === coords.length - 1 ? 4 : 2.5}
          fill="currentColor"
        />
      ))}
      <circle cx={last.x} cy={last.y} r={7} fill="currentColor" opacity={0.15} />
    </svg>
  );
}

export function PriceStatsSummary({ stats }: { stats: PriceStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <PriceStatItem label="Atual" value={formatCurrencyBRL(stats.currentCents)} emphasize />
      <PriceStatItem label="Menor" value={formatCurrencyBRL(stats.minCents)} />
      <PriceStatItem label="Maior" value={formatCurrencyBRL(stats.maxCents)} />
      <PriceStatItem label="Média" value={formatCurrencyBRL(stats.avgCents)} />
    </div>
  );
}

function PriceStatItem({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div>
      <p className="text-text-muted text-xs tracking-wide uppercase">{label}</p>
      <p className={emphasize ? "text-brand text-lg font-bold" : "text-text text-lg font-semibold"}>
        {value}
      </p>
    </div>
  );
}
