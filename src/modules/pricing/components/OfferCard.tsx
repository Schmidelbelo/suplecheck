import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrencyBRL } from "@/lib/utils/format";
import {
  classificationBadgeVariant,
  classificationLabel,
} from "@/modules/evaluation/lib/classification";
import type { ProductPriceInfo } from "../lib/offersOverview";

export function OfferCard({ info, footer }: { info: ProductPriceInfo; footer?: string }) {
  const { entry, stats } = info;

  return (
    <Link href={`/creatina/${entry.product.slug}`}>
      <Card className="hover:border-border-strong flex h-full flex-col gap-3 p-4 transition-shadow duration-(--duration-base) ease-(--ease-standard) hover:shadow-md">
        <div className="flex items-center gap-3">
          <Image
            src={entry.product.imageUrl ?? "/images/products/creatina-placeholder.svg"}
            alt={entry.product.name}
            width={48}
            height={48}
            className="border-border bg-bg-subtle size-12 shrink-0 rounded-md border object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-text-muted truncate text-xs uppercase">{entry.product.brand.name}</p>
            <p className="text-text truncate text-sm font-semibold">{entry.product.name}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            {stats ? (
              <p className="text-text text-lg font-bold tabular-nums">
                {formatCurrencyBRL(stats.currentCents)}
              </p>
            ) : null}
            {stats?.changePercent != null ? (
              <p
                className={stats.changePercent < 0 ? "text-success text-xs" : "text-danger text-xs"}
              >
                {stats.changePercent > 0 ? "+" : ""}
                {stats.changePercent.toFixed(0)}%
              </p>
            ) : null}
          </div>
          <Badge variant={classificationBadgeVariant(entry.classificationTier)}>
            {classificationLabel(entry.classificationTier)}
          </Badge>
        </div>
        {footer ? <p className="text-text-subtle text-xs">{footer}</p> : null}
      </Card>
    </Link>
  );
}
