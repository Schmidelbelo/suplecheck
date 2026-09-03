import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrencyBRL } from "@/lib/utils/format";
import type { ProductPriceInfo } from "../lib/offersOverview";

const TREND_META = {
  up: { icon: TrendingUp, label: "Subindo", className: "text-danger" },
  down: { icon: TrendingDown, label: "Caindo", className: "text-success" },
  flat: { icon: Minus, label: "Estável", className: "text-text-muted" },
} as const;

/**
 * Evolução de preço de todo o catálogo — menor/maior já registrado,
 * preço atual, variação % e tendência, tudo vindo de `PriceStats`
 * (`computePriceStats`, já existente). Produto com só 1 captura (ou
 * nenhuma) mostra "Sem histórico suficiente" explicitamente — nunca uma
 * variação ou tendência calculada de um único ponto.
 */
export function PriceEvolutionTable({ products }: { products: readonly ProductPriceInfo[] }) {
  if (products.length === 0) return null;

  return (
    <Card className="overflow-x-auto">
      <CardContent className="p-0">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-border text-text-muted border-b text-left text-xs tracking-wide uppercase">
              <th className="px-4 py-3 font-semibold">Produto</th>
              <th className="px-4 py-3 font-semibold">Preço atual</th>
              <th className="px-4 py-3 font-semibold">Menor registrado</th>
              <th className="px-4 py-3 font-semibold">Maior registrado</th>
              <th className="px-4 py-3 font-semibold">Variação</th>
              <th className="px-4 py-3 font-semibold">Tendência</th>
            </tr>
          </thead>
          <tbody>
            {products.map(({ entry, stats }) => {
              const hasEnoughHistory = stats != null && stats.capturesCount > 1;
              return (
                <tr key={entry.product.id} className="border-border border-b last:border-0">
                  <td className="text-text px-4 py-3 font-medium">{entry.product.name}</td>
                  {stats == null ? (
                    <td colSpan={5} className="text-text-subtle px-4 py-3">
                      Sem captura de preço registrada ainda.
                    </td>
                  ) : !hasEnoughHistory ? (
                    <>
                      <td className="text-text px-4 py-3 tabular-nums">
                        {formatCurrencyBRL(stats.currentCents)}
                      </td>
                      <td colSpan={4} className="text-text-subtle px-4 py-3">
                        Sem histórico suficiente para variação/tendência (só 1 captura).
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="text-text px-4 py-3 tabular-nums">
                        {formatCurrencyBRL(stats.currentCents)}
                      </td>
                      <td className="text-text-muted px-4 py-3 tabular-nums">
                        {formatCurrencyBRL(stats.minCents)}
                      </td>
                      <td className="text-text-muted px-4 py-3 tabular-nums">
                        {formatCurrencyBRL(stats.maxCents)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {stats.changePercent != null ? (
                          <span
                            className={stats.changePercent < 0 ? "text-success" : "text-danger"}
                          >
                            {stats.changePercent > 0 ? "+" : ""}
                            {stats.changePercent.toFixed(1)}%
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {stats.changeDirection ? (
                          <span
                            className={`flex items-center gap-1.5 ${TREND_META[stats.changeDirection].className}`}
                          >
                            {(() => {
                              const Icon = TREND_META[stats.changeDirection].icon;
                              return <Icon className="size-4" aria-hidden />;
                            })()}
                            {TREND_META[stats.changeDirection].label}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
