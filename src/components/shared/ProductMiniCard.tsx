import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { formatCurrencyBRL } from "@/lib/utils/format";
import {
  classificationLabel,
  classificationBadgeVariant,
} from "@/modules/evaluation/lib/classification";

/**
 * Núcleo visual repetido em 4 lugares antes desta consolidação:
 * `RelatedProductCard` (produtos parecidos), `AlternativeRecommendationCard`
 * (melhor alternativa), `OfferCard` (/ofertas) e `MiniProductCard`
 * (dashboard). Cada chamador continua livre para envolver isto num
 * `<Link>`/`<Card>` próprio e adicionar seu conteúdo específico (ícone
 * de slot, variação de preço, rodapé de visitas) — só o miolo
 * imagem+marca+nome+preço+badge é compartilhado.
 */
export function ProductMiniCard({
  imageUrl,
  name,
  brandName,
  priceCents,
  storeName,
  classificationTier,
  score,
}: {
  imageUrl: string | null;
  name: string;
  brandName: string;
  priceCents: number | null;
  /**
   * Nome da loja da oferta atual — opcional (nem todo chamador tem o
   * `PriceEntry.store` à mão) e só renderizado quando há preço; nunca
   * mostrar loja sem preço junto, evita sugerir uma oferta que não existe.
   */
  storeName?: string | null;
  classificationTier: string;
  /** Nota a exibir (Índice SupleScore ou Score Geral, conforme o contexto do chamador). */
  score: number;
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        <Image
          src={imageUrl ?? "/products/default-card.webp"}
          alt={name}
          width={64}
          height={64}
          className="border-border bg-bg-subtle size-16 shrink-0 rounded-md border object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="text-text-muted truncate text-xs uppercase">{brandName}</p>
          <p className="text-text truncate text-sm font-semibold">{name}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0">
          <span className="text-text block text-sm font-semibold tabular-nums">
            {priceCents != null ? formatCurrencyBRL(priceCents) : "—"}
          </span>
          {priceCents != null && storeName ? (
            <span className="text-text-muted block truncate text-xs">na {storeName}</span>
          ) : null}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-text-muted text-xs tabular-nums">{score.toFixed(1)}</span>
          <Badge variant={classificationBadgeVariant(classificationTier)}>
            {classificationLabel(classificationTier)}
          </Badge>
        </div>
      </div>
    </>
  );
}
