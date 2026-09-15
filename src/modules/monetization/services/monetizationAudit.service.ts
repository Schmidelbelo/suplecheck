import { prisma } from "@/lib/db/prisma";

/**
 * Auditoria de cobertura de monetização — a mesma lógica de
 * `resolveOutboundClick`/`buildAffiliateUrl` (nunca inventa link:
 * só considera monetizado quando `Store.isAffiliate=true` E
 * `Store.affiliateBaseUrl` está preenchido), aplicada ao catálogo
 * inteiro para responder "onde estamos perdendo comissão e por quê".
 * Read-only — nunca escreve nada, só lê o estado real do banco.
 */

export type MonetizationBlockReason =
  | "STORE_NOT_AFFILIATE" // Store.isAffiliate = false
  | "MISSING_AFFILIATE_URL" // isAffiliate = true, affiliateBaseUrl ausente
  | "MISSING_PRICE_URL"; // PriceEntry.url ausente (nunca monta redirect sem URL real)

export interface BlockedOffer {
  readonly productId: string;
  readonly productSlug: string;
  readonly productName: string;
  readonly categorySlug: string;
  readonly storeSlug: string;
  readonly storeName: string;
  readonly priceCents: number;
  readonly reason: MonetizationBlockReason;
}

export interface StoreCoverage {
  readonly storeSlug: string;
  readonly storeName: string;
  readonly isAffiliate: boolean;
  readonly hasAffiliateUrl: boolean;
  readonly offersTotal: number;
  readonly offersMonetized: number;
  readonly offersBlocked: number;
  readonly blockReason: MonetizationBlockReason | null;
}

export interface CategoryCoverage {
  readonly categorySlug: string;
  readonly categoryName: string;
  readonly productsTotal: number;
  readonly productsMonetized: number;
}

export interface RecommendedAction {
  readonly storeSlug: string;
  readonly storeName: string;
  readonly reason: MonetizationBlockReason;
  readonly productsUnlocked: number;
  readonly effort: "low" | "medium";
  readonly description: string;
}

export interface MonetizationAudit {
  readonly generatedAt: string;
  readonly productsTotal: number;
  readonly productsMonetized: number;
  readonly productsWithPriceNotMonetized: number;
  readonly productsWithoutAnyPrice: number;
  readonly storeCoverage: readonly StoreCoverage[];
  readonly categoryCoverage: readonly CategoryCoverage[];
  readonly blockedOffers: readonly BlockedOffer[];
  readonly recommendedActions: readonly RecommendedAction[];
}

function classifyBlock(store: {
  isAffiliate: boolean;
  affiliateBaseUrl: string | null;
}): MonetizationBlockReason | null {
  if (!store.isAffiliate) return "STORE_NOT_AFFILIATE";
  if (!store.affiliateBaseUrl) return "MISSING_AFFILIATE_URL";
  return null;
}

export async function getMonetizationAudit(): Promise<MonetizationAudit> {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      name: true,
      category: { select: { slug: true, name: true } },
      skus: {
        where: { status: "ACTIVE" },
        select: {
          priceEntries: {
            orderBy: { capturedAt: "desc" },
            select: {
              priceCents: true,
              url: true,
              store: {
                select: { slug: true, name: true, isAffiliate: true, affiliateBaseUrl: true },
              },
            },
          },
        },
      },
    },
  });

  interface MutableStoreRow {
    storeSlug: string;
    storeName: string;
    isAffiliate: boolean;
    hasAffiliateUrl: boolean;
    offersTotal: number;
    offersMonetized: number;
    offersBlocked: number;
    blockCount: Record<MonetizationBlockReason, number>;
  }
  interface MutableCategoryRow {
    categorySlug: string;
    categoryName: string;
    productsTotal: number;
    productsMonetized: number;
  }

  const storeMap = new Map<string, MutableStoreRow>();
  const categoryMap = new Map<string, MutableCategoryRow>();
  const blockedOffers: BlockedOffer[] = [];

  let productsMonetized = 0;
  let productsWithPriceNotMonetized = 0;
  let productsWithoutAnyPrice = 0;

  for (const product of products) {
    // última captura por loja (todas as lojas com oferta deste produto, não só a 1ª SKU) —
    // é isso que permite responder "quantos produtos essa loja destrava".
    const latestByStore = new Map<
      string,
      {
        priceCents: number;
        url: string | null;
        store: (typeof product.skus)[number]["priceEntries"][number]["store"];
      }
    >();
    for (const sku of product.skus) {
      for (const entry of sku.priceEntries) {
        if (!latestByStore.has(entry.store.slug)) {
          latestByStore.set(entry.store.slug, entry);
        }
      }
    }

    if (latestByStore.size === 0) {
      productsWithoutAnyPrice++;
      continue;
    }

    let productHasMonetizedOffer = false;

    for (const entry of latestByStore.values()) {
      const { store } = entry;
      if (!storeMap.has(store.slug)) {
        storeMap.set(store.slug, {
          storeSlug: store.slug,
          storeName: store.name,
          isAffiliate: store.isAffiliate,
          hasAffiliateUrl: !!store.affiliateBaseUrl,
          offersTotal: 0,
          offersMonetized: 0,
          offersBlocked: 0,
          blockCount: { STORE_NOT_AFFILIATE: 0, MISSING_AFFILIATE_URL: 0, MISSING_PRICE_URL: 0 },
        });
      }
      const storeRow = storeMap.get(store.slug)!;
      storeRow.offersTotal++;

      const structuralReason = classifyBlock(store);
      const reason: MonetizationBlockReason | null =
        structuralReason ?? (!entry.url ? "MISSING_PRICE_URL" : null);

      if (!reason) {
        storeRow.offersMonetized++;
        productHasMonetizedOffer = true;
      } else {
        storeRow.offersBlocked++;
        storeRow.blockCount[reason]++;
        blockedOffers.push({
          productId: product.id,
          productSlug: product.slug,
          productName: product.name,
          categorySlug: product.category.slug,
          storeSlug: store.slug,
          storeName: store.name,
          priceCents: entry.priceCents,
          reason,
        });
      }
    }

    if (!categoryMap.has(product.category.slug)) {
      categoryMap.set(product.category.slug, {
        categorySlug: product.category.slug,
        categoryName: product.category.name,
        productsTotal: 0,
        productsMonetized: 0,
      });
    }
    const categoryRow = categoryMap.get(product.category.slug)!;
    categoryRow.productsTotal++;
    if (productHasMonetizedOffer) {
      categoryRow.productsMonetized++;
      productsMonetized++;
    } else {
      productsWithPriceNotMonetized++;
    }
  }

  // Motivo predominante por loja (para exibição simples "por que essa loja está bloqueada") —
  // uma loja pode ter mais de um motivo (ex.: alguns produtos sem URL de preço, outros só
  // faltando affiliateBaseUrl), mas o dominante é o que orienta a próxima ação comercial.
  const storeCoverage: StoreCoverage[] = [...storeMap.values()]
    .map((row) => {
      const dominant = (Object.entries(row.blockCount) as [MonetizationBlockReason, number][])
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])[0]?.[0];
      return {
        storeSlug: row.storeSlug,
        storeName: row.storeName,
        isAffiliate: row.isAffiliate,
        hasAffiliateUrl: row.hasAffiliateUrl,
        offersTotal: row.offersTotal,
        offersMonetized: row.offersMonetized,
        offersBlocked: row.offersBlocked,
        blockReason: row.offersBlocked > 0 ? (dominant ?? null) : null,
      };
    })
    .sort((a, b) => b.offersBlocked - a.offersBlocked);

  // Priorização: destravar uma loja já `isAffiliate=true` só exige colar a
  // `affiliateBaseUrl` real (baixo esforço) — vira antes de qualquer loja
  // que ainda precisaria de uma decisão comercial nova (entrar num programa
  // de afiliados que hoje nem existe pra ela, esforço maior).
  const recommendedActions: RecommendedAction[] = storeCoverage
    .filter((s) => s.offersBlocked > 0)
    .map((s) => {
      if (s.isAffiliate && !s.hasAffiliateUrl) {
        return {
          storeSlug: s.storeSlug,
          storeName: s.storeName,
          reason: "MISSING_AFFILIATE_URL" as const,
          productsUnlocked: s.offersBlocked,
          effort: "low" as const,
          description: `Já marcada como afiliada — só falta colar o link/tag real de afiliado (Store.affiliateBaseUrl) pra destravar ${s.offersBlocked} produto${s.offersBlocked === 1 ? "" : "s"} imediatamente.`,
        };
      }
      if (!s.isAffiliate) {
        return {
          storeSlug: s.storeSlug,
          storeName: s.storeName,
          reason: "STORE_NOT_AFFILIATE" as const,
          productsUnlocked: s.offersBlocked,
          effort: "medium" as const,
          description: `Precisa entrar (ou confirmar) o programa de afiliados desta loja antes de qualquer link — decisão comercial, não só técnica. Destrava ${s.offersBlocked} produto${s.offersBlocked === 1 ? "" : "s"}.`,
        };
      }
      return {
        storeSlug: s.storeSlug,
        storeName: s.storeName,
        reason: "MISSING_PRICE_URL" as const,
        productsUnlocked: s.offersBlocked,
        effort: "low" as const,
        description: `Loja já afiliada e configurada — os produtos bloqueados aqui estão sem PriceEntry.url (recaptura de preço resolve, não é decisão comercial). Destrava ${s.offersBlocked} produto${s.offersBlocked === 1 ? "" : "s"}.`,
      };
    })
    .sort((a, b) => {
      if (a.effort !== b.effort) return a.effort === "low" ? -1 : 1;
      return b.productsUnlocked - a.productsUnlocked;
    });

  return {
    generatedAt: new Date().toISOString(),
    productsTotal: products.length,
    productsMonetized,
    productsWithPriceNotMonetized,
    productsWithoutAnyPrice,
    storeCoverage,
    categoryCoverage: [...categoryMap.values()].sort((a, b) => b.productsTotal - a.productsTotal),
    blockedOffers: blockedOffers.sort((a, b) => b.priceCents - a.priceCents),
    recommendedActions,
  };
}
