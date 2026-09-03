import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { formatCurrencyBRL } from "@/lib/utils/format";
import { classificationLabel, classificationBadgeVariant } from "../lib/classification";
import { FavoriteButton } from "./FavoriteButton";
import type { RankingViewEntry } from "../types";

export function RankingEntryCard({
  entry,
  compareChecked,
  onCompareToggle,
  compareDisabled,
}: {
  entry: RankingViewEntry;
  /** Omitido = comparação desligada nesta tela (ex.: preview da home). */
  compareChecked?: boolean;
  onCompareToggle?: (checked: boolean) => void;
  compareDisabled?: boolean;
}) {
  const { product } = entry;
  const showCompare = onCompareToggle !== undefined;

  return (
    <Card className="hover:border-border-strong flex flex-col gap-4 p-4 transition-shadow duration-(--duration-base) ease-(--ease-standard) hover:shadow-md sm:flex-row sm:items-center sm:p-6">
      {showCompare ? (
        <Checkbox
          checked={compareChecked}
          disabled={!compareChecked && compareDisabled}
          onCheckedChange={(checked) => onCompareToggle?.(checked === true)}
          aria-label={`Selecionar ${product.name} para comparar`}
          className="shrink-0 self-start sm:self-center"
        />
      ) : null}

      <div className="text-text-subtle flex w-10 shrink-0 items-center justify-center text-2xl font-bold sm:w-12">
        #{entry.position}
      </div>

      <Image
        src={product.imageUrl ?? "/images/products/creatina-placeholder.svg"}
        alt={product.name}
        width={80}
        height={80}
        className="border-border bg-bg-subtle size-20 shrink-0 self-center rounded-md border object-cover"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="text-text-muted text-xs font-medium tracking-wide uppercase">
            {product.brand.name}
          </p>
          {entry.position === 1 ? (
            <Badge variant="success" className="shrink-0">
              Nº1 do ranking
            </Badge>
          ) : null}
        </div>
        <h3 className="text-text truncate text-base font-semibold">{product.name}</h3>
        {product.sku ? (
          <p className="text-text-muted text-sm">
            {product.sku.variantLabel}
            {product.sku.servingsPerUnit ? ` · ${product.sku.servingsPerUnit} porções` : ""}
          </p>
        ) : null}
        {entry.badges.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {entry.badges.map((badge) => (
              <Badge key={badge.label} variant="brand" className="gap-1">
                <span aria-hidden>{badge.emoji}</span>
                {badge.label}
              </Badge>
            ))}
          </div>
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

      <div className="flex shrink-0 items-center gap-2">
        <FavoriteButton productId={product.id} productName={product.name} />
        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
          <Link href={`/creatina/${product.slug}`}>Ver detalhes</Link>
        </Button>
      </div>
    </Card>
  );
}
