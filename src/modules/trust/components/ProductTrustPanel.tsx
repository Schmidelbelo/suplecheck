import Link from "next/link";
import {
  UpdatedBadge,
  VerifiedDataBadge,
  ConfirmedPriceBadge,
  PublicMethodologyBadge,
} from "./TrustBadges";
import { WhyTrustCard, HowEvaluatedCard, LastRevisionCard } from "./TrustCards";
import type { ProductView } from "@/modules/evaluation/types";

/**
 * "Sistema" de transparência por produto pedido pelo Trust Center: data
 * de atualização, data de revisão, quantidade de critérios avaliados,
 * fonte dos dados, aviso de transparência e política de afiliados
 * resumida — tudo derivado de `ProductView` (mesma leitura que já
 * alimenta o resto da página de produto), nunca um dado novo inventado.
 * Cada selo/cartão só aparece quando o fato que o sustenta existe de
 * verdade (ver comentários em `TrustBadges.tsx`).
 */
export function ProductTrustPanel({ view }: { view: ProductView }) {
  const { product, presentation, score } = view;
  const hasPrice = !!presentation?.price;
  const sourceUrl =
    typeof product.attributes.sourceUrl === "string" ? product.attributes.sourceUrl : null;

  return (
    <div className="border-border flex flex-col gap-5 rounded-lg border p-5">
      <div className="flex flex-wrap items-center gap-2">
        <UpdatedBadge date={product.updatedAt} />
        {score && hasPrice ? <VerifiedDataBadge /> : null}
        {hasPrice ? <ConfirmedPriceBadge /> : null}
        <PublicMethodologyBadge />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <WhyTrustCard />
        {score ? <HowEvaluatedCard criteriaCount={score.breakdown.length} /> : null}
        {score ? <LastRevisionCard calculatedAt={score.calculatedAt} /> : null}
      </div>

      <div className="text-text-subtle flex flex-col gap-2 text-xs">
        {sourceUrl ? (
          <p>
            Fonte dos dados de composição e preço:{" "}
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-brand font-medium hover:underline"
            >
              página oficial do produto
            </a>
            .
          </p>
        ) : null}
        <p>
          Aviso de transparência: preço, composição e nota podem mudar entre visitas — o SupleScore
          nunca reaproveita um dado antigo para preencher uma lacuna atual. Quando uma informação
          não pode ser confirmada, ela aparece em branco, nunca estimada.
        </p>
        <p>
          Este produto pode gerar comissão de afiliado quando comprado por um link daqui — isso
          nunca influencia a nota. Detalhes na página{" "}
          <Link href="/como-ganhamos-dinheiro" className="text-brand font-medium hover:underline">
            Como Ganhamos Dinheiro
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
