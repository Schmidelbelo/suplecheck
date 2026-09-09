import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Sprint de Crescimento — resolve o bloqueio da Black Skull Whey
 * Protein Concentrado 80% HD 900g. Composição (24g proteína/30g
 * porção) já estava confirmada na página oficial (sprint anterior) —
 * não alterada aqui. Preço/URL reais capturados na Amazon nesta
 * sprint (mesma linha de produto, sabor Morango, refil 900g).
 */

const PRODUCT_SLUG = "black-skull-whey-protein-concentrado-900g";

const PRICE = {
  storeSlug: "amazon-br",
  priceCents: 21990, // R$ 219,90 — preço confirmado na Amazon no momento da captura
  url: "https://www.amazon.com.br/Whey-Protein-Concentrado-80-HD/dp/B0G6WYK4B3",
  capturedAt: "2026-09-09",
} as const;

const WHEY_PROTEIN_METHODOLOGY_ID = "whey-protein-methodology";

interface ProductAttributes {
  proteinPerDoseGrams: number;
  [key: string]: unknown;
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
  const store = await prisma.store.findUniqueOrThrow({ where: { slug: PRICE.storeSlug } });

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
