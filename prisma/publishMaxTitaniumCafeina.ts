import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Sprint de Crescimento — Max Titanium Fire Black (Cafeína), 2º
 * produto da categoria. Composição (210mg de cafeína anidra por
 * cápsula) confirmada na descrição oficial do produto, replicada de
 * forma consistente em múltiplos revendedores. Preço real capturado
 * na Sua Saúde Distribuidora — nesta captura o item está sem estoque
 * ("Esgotado"), registrado honestamente como tal, não como disponível.
 */

const CATEGORY_SLUG = "cafeina";

const PRODUCT = {
  slug: "max-titanium-fire-black-60-capsulas",
  name: "Max Titanium Fire Black 60 Cápsulas (Cafeína)",
  variantLabel: "60 cápsulas",
  caffeinePerDoseMg: 210,
  servingsPerUnit: 60,
  ingredientsText:
    "Amido de milho, cafeína anidra (210mg/cápsula), antiumectante fosfato tricálcico, cápsula (gelatina, água purificada, dióxido de titânio, corantes amarelo crepúsculo/azorrubina/azul brilhante, conservante INS 218).",
  sourceUrl: "https://www.maxtitanium.com.br/produtos/termogenicos/fire-black",
} as const;

const PRICE = {
  storeSlug: "sua-saude-distribuidora",
  priceCents: 2899,
  url: "https://suasaudedistribuidora.com.br/products/fire-black-max-titanium",
  capturedAt: "2026-09-09",
  availability: "OUT_OF_STOCK" as const,
} as const;

const REFERENCE_RANGE_MG = { min: 50, max: 400 } as const;

async function ensureStore() {
  await prisma.store.upsert({
    where: { slug: PRICE.storeSlug },
    create: { slug: PRICE.storeSlug, name: "Sua Saúde Distribuidora", isAffiliate: false },
    update: {},
  });
}

async function createProductAndSku() {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: CATEGORY_SLUG } });
  const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: "max-titanium" } });

  const product = await prisma.product.upsert({
    where: { slug: PRODUCT.slug },
    create: {
      slug: PRODUCT.slug,
      name: PRODUCT.name,
      categoryId: category.id,
      brandId: brand.id,
      status: "DRAFT",
      attributes: {
        caffeinePerDoseMg: PRODUCT.caffeinePerDoseMg,
        ingredients: PRODUCT.ingredientsText,
        sourceUrl: PRODUCT.sourceUrl,
      },
    },
    update: {},
  });

  let sku = await prisma.sku.findFirst({
    where: { productId: product.id, variantLabel: PRODUCT.variantLabel },
  });
  if (!sku) {
    sku = await prisma.sku.create({
      data: {
        productId: product.id,
        variantLabel: PRODUCT.variantLabel,
        servingsPerUnit: PRODUCT.servingsPerUnit,
        dosagePerServing: PRODUCT.caffeinePerDoseMg,
        status: "ACTIVE",
      },
    });
  }

  return { product, sku };
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
  const { product, sku } = await createProductAndSku();
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
        availability: PRICE.availability,
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
    PRODUCT.servingsPerUnit,
  );

  const container = buildInfrastructureContainer();
  await container.useCases.evaluateSupplement.execute({
    supplementId: product.id,
    facts: {
      composition: {
        activeIngredientAmountPerServing: PRODUCT.caffeinePerDoseMg,
        referenceRangePerServing: REFERENCE_RANGE_MG,
        additives: [],
        undisclosedSubstances: [],
      },
      pricing: {
        priceInCents: PRICE.priceCents,
        dosesPerUnit: PRODUCT.servingsPerUnit,
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
  const ranking = await container.useCases.generateRanking.execute({
    categorySlug: CATEGORY_SLUG,
  });
  console.warn(`Ranking de ${CATEGORY_SLUG} regenerado com ${ranking.entries.length} entradas.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
