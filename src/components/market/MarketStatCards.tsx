import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrencyBRL } from "@/lib/utils/format";
import type { MarketStatistics } from "@core/index";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-5">
        <p className="text-text-muted text-xs font-semibold tracking-wide uppercase">{label}</p>
        <p className="text-text truncate text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

/** Cards do Panorama do Mercado — cada valor vem direto de `MarketStatistics`, sem nenhum placeholder. */
export function MarketStatCards({ statistics }: { statistics: MarketStatistics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Produtos cadastrados" value={String(statistics.productCount)} />
      <StatCard label="Marcas" value={String(statistics.brandCount)} />
      <StatCard
        label="Preço médio do mercado"
        value={
          statistics.averagePriceCents != null
            ? formatCurrencyBRL(statistics.averagePriceCents)
            : "—"
        }
      />
      <StatCard
        label="Preço mínimo"
        value={statistics.minPriceCents != null ? formatCurrencyBRL(statistics.minPriceCents) : "—"}
      />
      <StatCard
        label="Preço máximo"
        value={statistics.maxPriceCents != null ? formatCurrencyBRL(statistics.maxPriceCents) : "—"}
      />
      <StatCard
        label="Melhor Score Geral"
        value={statistics.bestOverallScore != null ? statistics.bestOverallScore.toFixed(1) : "—"}
      />
      <StatCard
        label="Pior Score Geral"
        value={statistics.worstOverallScore != null ? statistics.worstOverallScore.toFixed(1) : "—"}
      />
      <StatCard
        label="Média geral das notas"
        value={statistics.averageScore != null ? statistics.averageScore.toFixed(1) : "—"}
      />
    </div>
  );
}
