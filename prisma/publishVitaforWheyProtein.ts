import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Sprint de Crescimento — resolve o bloqueio da Vitafor Whey Protein
 * Concentrado (WPC) 900g. Composição (21g proteína/30g porção) já
 * estava confirmada na página oficial (sprint anterior). Preço e URL
 * reais capturados nesta sprint na própria loja oficial da marca
 * (vitafor.com.br), mesmo domínio já usado para a composição.
 */

const STORE = { slug: "vitafor-oficial", name: "Loja Oficial Vitafor" } as const;

const PRODUCT_SLUG = "vitafor-whey-protein-concentrado-900g";

const PRICE = {
  priceCents: 18400, // R$ 184,00 — preço promocional (20% off) exibido na página oficial no momento da captura
  url: "https://www.vitafor.com.br/whey-protein-wpc-pouch-900g-morango/p",
  capturedAt: "2026-09-09",
} as const;

const WHEY_PROTEIN_METHODOLOGY_ID = "whey-protein-methodology";

interface ProductAttributes {
  servingSizeGrams: number;
  proteinPerDoseGrams: number;
  [key: string]: unknown;
}

async function ensureStore() {
  await prisma.store.upsert({
    where: { slug: STORE.slug },
    create: { ...STORE, isAffiliate: false },
    update: { name: STORE.name },
  });
}

async function computeCategoryAveragePricePerDoseCents(
  categoryId: string,
  fallbackPriceCents: number,
  fallbackServingsPerUnit: number,
): Promise<number> {
  const publishedSkus = await prisma.sku.findMany({
    where: { product: { categoryId, status: "PUBLISHED" } },
    select: {
      servingsPerUnit: true,
      priceEntries: { orderBy: { capturedAt: "desc" }, take: 1, select: { priceCents: true } },
    },
  });

  const perDose = publishedSkus
    .map((s) => {
      const latest = s.priceEntries[0];
      if (!latest || !s.servingsPerUnit) return null;
      return latest.priceCents / s.servingsPerUnit;
    })
    .filter((v): v is number => v !== null);

  if (perDose.length === 0) return Math.round(fallbackPriceCents / fallbackServingsPerUnit);
  return Math.round(perDose.reduce((sum, v) => sum + v, 0) / perDose.length);
}

async function publishAndEvaluate() {
  const product = await prisma.product.findUniqueOrThrow({ where: { slug: PRODUCT_SLUG } });
  const attributes = product.attributes as unknown as ProductAttributes;
  const sku = await prisma.sku.findFirstOrThrow({ where: { productId: product.id } });
  const store = await prisma.store.findUniqueOrThrow({ where: { slug: STORE.slug } });

  const existingPrice = await prisma.priceEntry.findFirst({
    where: { skuId: sku.id, storeId: store.id },
  });
  if (!existingPrice) {
    await prisma.priceEntry.create({
      data: {
        skuId: sku.id,
        storeId: store.id,
        priceCents: PRICE.priceCents,
        url: PRICE.url,
        availability: "IN_STOCK",
      },
    });
  }

  const existingImage = await prisma.productImage.findFirst({
    where: { productId: product.id, role: "COVER" },
  });
  if (!existingImage) {
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: "/images/products/creatina-placeholder.svg",
        altText: product.name,
        role: "COVER",
      },
    });
  }

  await prisma.product.update({ where: { id: product.id }, data: { status: "PUBLISHED" } });

  const categoryAveragePricePerDoseInCents = await computeCategoryAveragePricePerDoseCents(
    product.categoryId,
    PRICE.priceCents,
    sku.servingsPerUnit ?? 30,
  );

  const container = buildInfrastructureContainer();
  await container.useCases.evaluateSupplement.execute({
    supplementId: product.id,
    facts: {
      composition: {
        activeIngredientAmountPerServing: attributes.proteinPerDoseGrams,
        referenceRangePerServing: { min: 18, max: 30 },
        additives: [],
        undisclosedSubstances: [],
      },
      pricing: {
        priceInCents: PRICE.priceCents,
        dosesPerUnit: sku.servingsPerUnit ?? 30,
        categoryAveragePricePerDoseInCents,
      },
      label: {
        hasProprietaryBlend: false,
        nutritionalInfoComplete: true,
        dosageClearlyStated: true,
      },
      ...(store.trustScore != null
        ? { store: { trustScore: store.trustScore, hasBuyerProtection: true } }
        : {}),
    },
  });

  console.warn(
    `Publicado + avaliado: ${product.name} (R$ ${(PRICE.priceCents / 100).toFixed(2)} via ${PRICE.url})`,
  );
}

async function main() {
  await ensureStore();
  await publishAndEvaluate();

  const container = buildInfrastructureContainer();
  await container.ports.methodologies.setActiveForCategory(
    "whey-protein",
    WHEY_PROTEIN_METHODOLOGY_ID,
    (await container.ports.methodologies.findById(WHEY_PROTEIN_METHODOLOGY_ID))!.version,
  );

  const ranking = await container.useCases.generateRanking.execute({
    categorySlug: "whey-protein",
  });
  console.warn(`Ranking de whey-protein regenerado com ${ranking.entries.length} entradas.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
