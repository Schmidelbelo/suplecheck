import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ProductMiniCard } from "@/components/shared/ProductMiniCard";
import type { ProductPriceInfo } from "../lib/offersOverview";

export function OfferCard({ info, footer }: { info: ProductPriceInfo; footer?: string }) {
  const { entry, stats } = info;

  return (
    <Link href={`/creatina/${entry.product.slug}`}>
      <Card className="hover:border-border-strong flex h-full flex-col gap-3 p-4 transition-shadow duration-(--duration-base) ease-(--ease-standard) hover:shadow-md">
        <ProductMiniCard
          imageUrl={entry.product.imageUrl}
          name={entry.product.name}
          brandName={entry.product.brand.name}
          priceCents={stats?.currentCents ?? entry.product.price?.cents ?? null}
          classificationTier={entry.classificationTier}
          score={entry.finalScore}
        />
        {stats?.changePercent != null ? (
          <p className={stats.changePercent < 0 ? "text-success text-xs" : "text-danger text-xs"}>
            {stats.changePercent > 0 ? "+" : ""}
            {stats.changePercent.toFixed(0)}%
          </p>
        ) : null}
        {footer ? <p className="text-text-subtle text-xs">{footer}</p> : null}
      </Card>
    </Link>
  );
}
