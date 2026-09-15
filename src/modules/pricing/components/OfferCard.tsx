import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProductMiniCard } from "@/components/shared/ProductMiniCard";
import { productDetailPath } from "@/lib/catalog/productRoutes";
import { buildOutboundHref } from "@/modules/monetization/lib/outboundLinkHref";
import type { ProductPriceInfo } from "../lib/offersOverview";

/**
 * `/ofertas` é a página de maior intenção de compra do catálogo — o
 * card inteiro não é mais só um `<Link>` para detalhes: a imagem/nome
 * continua linkando pra página do produto, mas ganha um botão "Ver
 * oferta" direto (via `/go`, nunca um `href` cru pra loja) quando o
 * produto tem preço. Sem preço, nenhum CTA externo falso — só o link
 * de detalhes continua disponível.
 */
export function OfferCard({ info, footer }: { info: ProductPriceInfo; footer?: string }) {
  const { entry, stats } = info;
  const detailHref = productDetailPath(entry.product.categorySlug, entry.product.slug);

  return (
    <Card className="hover:border-border-strong flex h-full flex-col gap-3 p-4 transition-shadow duration-(--duration-base) ease-(--ease-standard) hover:shadow-md">
      <Link href={detailHref} className="flex flex-col gap-3">
        <ProductMiniCard
          imageUrl={entry.product.imageUrl}
          name={entry.product.name}
          brandName={entry.product.brand.name}
          priceCents={stats?.currentCents ?? entry.product.price?.cents ?? null}
          classificationTier={entry.classificationTier}
          score={entry.finalScore}
        />
      </Link>
      {stats?.changePercent != null ? (
        <p className={stats.changePercent < 0 ? "text-success text-xs" : "text-danger text-xs"}>
          {stats.changePercent > 0 ? "+" : ""}
          {stats.changePercent.toFixed(0)}%
        </p>
      ) : null}
      {footer ? <p className="text-text-subtle text-xs">{footer}</p> : null}
      <div className="mt-auto flex items-center gap-2">
        {entry.product.price ? (
          <Button asChild size="sm" className="flex-1">
            <a
              href={buildOutboundHref({
                productSlug: entry.product.slug,
                source: "offers",
                position: entry.position,
              })}
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              Ver oferta
            </a>
          </Button>
        ) : null}
        <Button asChild variant="outline" size="sm" className={entry.product.price ? "" : "flex-1"}>
          <Link href={detailHref}>Detalhes</Link>
        </Button>
      </div>
    </Card>
  );
}
