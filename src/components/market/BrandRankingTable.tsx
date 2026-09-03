import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrencyBRL } from "@/lib/utils/format";
import type { BrandRankingEntry } from "@core/index";

function TopBrandCard({ entry, position }: { entry: BrandRankingEntry; position: number }) {
  return (
    <Card className="flex flex-col gap-2 p-5">
      <p className="text-brand text-xs font-semibold tracking-wide uppercase">{position}º lugar</p>
      <p className="text-text text-lg font-bold">{entry.brandName}</p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-muted">Nota média</span>
        <span className="text-text font-semibold tabular-nums">
          {entry.averageScore.toFixed(1)}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-muted">Produtos</span>
        <span className="text-text font-semibold tabular-nums">{entry.productCount}</span>
      </div>
    </Card>
  );
}

/** Ranking automático de marcas — ordenado por nota média das avaliações mais recentes de cada produto do catálogo. */
export function BrandRankingTable({
  brandRanking,
}: {
  brandRanking: readonly BrandRankingEntry[];
}) {
  if (brandRanking.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {brandRanking.slice(0, 3).map((entry, index) => (
          <TopBrandCard key={entry.brandId} entry={entry} position={index + 1} />
        ))}
      </div>

      <Card className="overflow-x-auto">
        <CardContent className="p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-border text-text-muted border-b text-left text-xs tracking-wide uppercase">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Marca</th>
                <th className="px-4 py-3 font-semibold">Nota média</th>
                <th className="px-4 py-3 font-semibold">Produtos</th>
                <th className="px-4 py-3 font-semibold">Preço médio</th>
                <th className="px-4 py-3 font-semibold">Melhor produto</th>
                <th className="px-4 py-3 font-semibold">Pior produto</th>
              </tr>
            </thead>
            <tbody>
              {brandRanking.map((entry, index) => (
                <tr key={entry.brandId} className="border-border border-b last:border-0">
                  <td className="text-text-muted px-4 py-3 tabular-nums">{index + 1}</td>
                  <td className="text-text px-4 py-3 font-medium">{entry.brandName}</td>
                  <td className="text-text px-4 py-3 tabular-nums">
                    {entry.averageScore.toFixed(1)}
                  </td>
                  <td className="text-text-muted px-4 py-3 tabular-nums">{entry.productCount}</td>
                  <td className="text-text-muted px-4 py-3 tabular-nums">
                    {entry.averagePriceCents != null
                      ? formatCurrencyBRL(entry.averagePriceCents)
                      : "—"}
                  </td>
                  <td className="text-text-muted px-4 py-3">{entry.bestProduct.name}</td>
                  <td className="text-text-muted px-4 py-3">{entry.worstProduct.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
