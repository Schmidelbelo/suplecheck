import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

const PRODUCT_SLUG = "probiotica-100-pure-whey-900g";
const STORE_SLUG = "amazon-br";
const PRICE = {
  priceCents: 14019,
  url: "https://www.amazon.com.br/100-Pure-Whey-Nova-F%C3%B3rmula/dp/B0BKQSX5CF",
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

async function main() {
  const product = await prisma.product.findUniqueOrThrow({ where: { slug: PRODUCT_SLUG } });
  const attributes = product.attributes as unknown as ProductAttributes;
  const sku = await prisma.sku.findFirstOrThrow({ where: { productId: product.id } });
  const store = await prisma.store.findUniqueOrThrow({ where: { slug: STORE_SLUG } });

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

  await container.ports.methodologies.setActiveForCategory(
    "whey-protein",
    WHEY_PROTEIN_METHODOLOGY_ID,
    (await container.ports.methodologies.findById(WHEY_PROTEIN_METHODOLOGY_ID))!.version,
  );
  const ranking = await container.useCases.generateRanking.execute({
    categorySlug: "whey-protein",
  });
  console.warn(
    `Publicado: ${product.name} (R$ ${(PRICE.priceCents / 100).toFixed(2)}). Ranking: ${ranking.entries.length} entradas.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
