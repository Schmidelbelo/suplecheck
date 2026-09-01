import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrencyBRL } from "@/lib/utils/format";
import { classificationLabel, classificationBadgeVariant } from "../lib/classification";
import type { RankingViewEntry } from "../types";

export function RankingEntryCard({ entry }: { entry: RankingViewEntry }) {
  const { product } = entry;

  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-6">
      <div className="text-text-subtle flex w-10 shrink-0 items-center justify-center text-2xl font-bold sm:w-12">
        #{entry.position}
      </div>

      <img
        src={product.imageUrl ?? "/images/products/creatina-placeholder.svg"}
        alt={product.name}
        className="border-border bg-bg-subtle size-20 shrink-0 self-center rounded-md border object-cover"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-text-muted text-xs font-medium tracking-wide uppercase">
          {product.brand.name}
        </p>
        <h3 className="text-text truncate text-base font-semibold">{product.name}</h3>
        {product.sku ? (
          <p className="text-text-muted text-sm">
            {product.sku.variantLabel}
            {product.sku.servingsPerUnit ? ` · ${product.sku.servingsPerUnit} porções` : ""}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
        <div className="flex items-center gap-2">
          <span className="text-text text-2xl font-bold tabular-nums">
            {entry.finalScore.toFixed(1)}
          </span>
          <Badge variant={classificationBadgeVariant(entry.classificationTier)}>
            {classificationLabel(entry.classificationTier)}
          </Badge>
        </div>
        {product.price ? (
          <div className="text-right">
            <p className="text-text text-sm font-semibold">
              {formatCurrencyBRL(product.price.cents)}
            </p>
            {product.price.pricePerDoseCents != null ? (
              <p className="text-text-muted text-xs">
                {formatCurrencyBRL(product.price.pricePerDoseCents)}/dose ·{" "}
                {product.price.store.name}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <Button asChild variant="outline" size="sm" className="w-full shrink-0 sm:w-auto">
        <Link href={`/creatina/${product.slug}`}>Ver detalhes</Link>
      </Button>
    </Card>
  );
}
