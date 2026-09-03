import { prisma } from "@/lib/db/prisma";
import { buildAffiliateUrl } from "../lib/affiliateUrl";
import type { OutboundClickSource } from "../lib/outboundLinkHref";

export interface OutboundClickInput {
  readonly productIdOrSlug: string;
  readonly source: string;
  readonly position: number | null;
}

export interface OutboundClickResult {
  readonly status: "redirect";
  readonly url: string;
  readonly isAffiliateLink: boolean;
}

export interface OutboundClickNotFound {
  readonly status: "not_found";
}

export interface OutboundClickNoOffer {
  readonly status: "no_offer";
  /** Slug do produto — a rota usa para redirecionar à página do produto em vez de um link externo inexistente. */
  readonly productSlug: string;
}

const VALID_SOURCES = new Set<OutboundClickSource>([
  "product-page",
  "product-page-mobile-bar",
  "alternative-recommendation",
  "related-product",
  "offers",
  "assistant-recommendation",
]);

/** Fonte livre, mas registrada sempre como algo reconhecível — nunca inventa uma categoria nova silenciosamente. */
function normalizeSource(source: string): string {
  return VALID_SOURCES.has(source as OutboundClickSource) ? source : "unknown";
}

/**
 * Resolve o produto (id ou slug), a oferta atual (SKU ativo + captura de
 * preço mais recente + loja) e devolve a URL final do redirect — grava
 * o clique em `OutboundClick` antes de devolver, best-effort (uma falha
 * ao gravar nunca impede o redirect real, só é reportada ao Sentry pelo
 * chamador). Três desfechos possíveis, nunca ambíguos: produto não
 * existe (`not_found`, 404 real), produto existe mas sem nenhuma oferta
 * cadastrada (`no_offer`, a rota manda para a página do produto em vez
 * de um link externo que não existe), ou o redirect de verdade.
 */
export async function resolveOutboundClick(
  input: OutboundClickInput,
): Promise<OutboundClickResult | OutboundClickNotFound | OutboundClickNoOffer> {
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: input.productIdOrSlug }, { slug: input.productIdOrSlug }] },
    select: {
      id: true,
      slug: true,
      categoryId: true,
      skus: {
        where: { status: "ACTIVE" },
        take: 1,
        select: {
          priceEntries: {
            orderBy: { capturedAt: "desc" },
            take: 1,
            select: {
              url: true,
              store: {
                select: { id: true, isAffiliate: true, affiliateBaseUrl: true },
              },
            },
          },
        },
      },
    },
  });
  if (!product) return { status: "not_found" };

  const priceEntry = product.skus[0]?.priceEntries[0];
  if (!priceEntry?.url || !priceEntry.store) {
    return { status: "no_offer", productSlug: product.slug };
  }

  const { url, isAffiliateLink } = buildAffiliateUrl({
    destinationUrl: priceEntry.url,
    store: priceEntry.store,
  });

  await prisma.outboundClick
    .create({
      data: {
        productId: product.id,
        storeId: priceEntry.store.id,
        categoryId: product.categoryId,
        source: normalizeSource(input.source),
        position: input.position,
        wasAffiliate: isAffiliateLink,
      },
    })
    .catch((error) => {
      // Nunca deixa uma falha de analytics quebrar o redirect real do
      // usuário — só reportamos e seguimos.
      console.error("[outboundClick] falha ao registrar clique", error);
    });

  return { status: "redirect", url, isAffiliateLink };
}
