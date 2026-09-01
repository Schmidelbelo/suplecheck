import { prisma } from "@/lib/db/prisma";

/**
 * Composição de leitura para as páginas públicas de avaliação — junta o
 * que a Application Layer já expõe (score/ranking, via `container`) com
 * dados de exibição que nunca foram modelados como Ports/DTOs de
 * Application (preço, loja, imagem — Store/PriceEntry/ProductImage não
 * têm Port próprio, ver ARCHITECTURE.md §3). Lê Prisma diretamente, no
 * mesmo padrão já usado por `src/modules/catalog/services/product.service.ts`
 * para a Fase 0 — não é uma camada técnica nova, é o mesmo padrão de
 * leitura de apresentação estendido para o módulo de Avaliação.
 */
export interface ProductPresentation {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly categorySlug: string;
  readonly brand: { readonly slug: string; readonly name: string };
  readonly manufacturer: { readonly slug: string; readonly name: string } | null;
  readonly imageUrl: string | null;
  readonly sku: {
    readonly variantLabel: string;
    readonly servingsPerUnit: number | null;
    readonly dosagePerServing: number | null;
  } | null;
  readonly price: {
    readonly cents: number;
    readonly pricePerDoseCents: number | null;
    readonly url: string | null;
    readonly store: { readonly slug: string; readonly name: string };
  } | null;
}

async function loadPresentation(productId: string): Promise<ProductPresentation | null> {
  const row = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      brand: true,
      manufacturer: true,
      images: { where: { role: "COVER" }, take: 1 },
      skus: {
        where: { status: "ACTIVE" },
        take: 1,
        include: {
          priceEntries: { orderBy: { capturedAt: "desc" }, take: 1, include: { store: true } },
        },
      },
    },
  });
  if (!row) return null;

  const sku = row.skus[0];
  const priceEntry = sku?.priceEntries[0];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    categorySlug: row.category.slug,
    brand: { slug: row.brand.slug, name: row.brand.name },
    manufacturer: row.manufacturer
      ? { slug: row.manufacturer.slug, name: row.manufacturer.name }
      : null,
    imageUrl: row.images[0]?.url ?? null,
    sku: sku
      ? {
          variantLabel: sku.variantLabel,
          servingsPerUnit: sku.servingsPerUnit,
          dosagePerServing: sku.dosagePerServing,
        }
      : null,
    price: priceEntry
      ? {
          cents: priceEntry.priceCents,
          pricePerDoseCents:
            sku?.servingsPerUnit && sku.servingsPerUnit > 0
              ? Math.round(priceEntry.priceCents / sku.servingsPerUnit)
              : null,
          url: priceEntry.url,
          store: { slug: priceEntry.store.slug, name: priceEntry.store.name },
        }
      : null,
  };
}

export const productViewService = {
  loadPresentation,

  async loadPresentations(
    productIds: readonly string[],
  ): Promise<Map<string, ProductPresentation>> {
    const entries = await Promise.all(
      productIds.map(async (id) => [id, await loadPresentation(id)] as const),
    );
    const map = new Map<string, ProductPresentation>();
    for (const [id, presentation] of entries) {
      if (presentation) map.set(id, presentation);
    }
    return map;
  },
};
