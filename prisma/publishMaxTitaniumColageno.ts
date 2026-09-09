import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Sprint de Crescimento — Colágeno (categoria nova). Max Titanium
 * Colagen 100 Cápsulas — composição (500mg/cápsula, dose de 4
 * cápsulas/dia = 2000mg/dose) confirmada de forma clara e sem
 * divergência na página do revendedor. Preço real capturado na mesma
 * fonte. Nenhuma metodologia dedicada existe para Colágeno —
 * reaproveita "creatina-methodology" como fallback.
 */

const CATEGORY = { slug: "colageno", name: "Colágeno" } as const;

const PRODUCT = {
  slug: "max-titanium-colagen-100-capsulas",
  name: "Max Titanium Colagen 100 Cápsulas",
  variantLabel: "100 cápsulas",
  collagenPerDoseMg: 2000, // 4 cápsulas de 500mg
  servingsPerUnit: 25, // 100 cápsulas / 4 por dose = 25 doses
  ingredientsText: "Colágeno hidrolisado, cápsula (gelatina, água purificada).",
  sourceUrl: "https://lojanutrifit.com.br/produto/colagen-100-capsulas-max-titanium/",
} as const;

const PRICE = {
  storeSlug: "loja-nutrifit",
  priceCents: 3500,
  url: "https://lojanutrifit.com.br/produto/colagen-100-capsulas-max-titanium/",
  capturedAt: "2026-09-09",
} as const;

const REFERENCE_RANGE_MG = { min: 1000, max: 15000 } as const;
const FALLBACK_METHODOLOGY_ID = "creatina-methodology";

async function ensureCategoryAndStore() {
  await prisma.category.upsert({
    where: { slug: CATEGORY.slug },
    create: { ...CATEGORY, active: true },
    update: { name: CATEGORY.name },
  });

  await prisma.store.upsert({
    where: { slug: PRICE.storeSlug },
    create: { slug: PRICE.storeSlug, name: "Loja Nutrifit", isAffiliate: false },
    update: {},
  });
}

async function createProductAndSku() {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: CATEGORY.slug } });
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
        collagenPerDoseMg: PRODUCT.collagenPerDoseMg,
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
        dosagePerServing: PRODUCT.collagenPerDoseMg,
        status: "ACTIVE",
      },
    });
  }

  return { product, sku };
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

  const categoryAveragePricePerDoseCents = Math.round(PRICE.priceCents / PRODUCT.servingsPerUnit);

  const container = buildInfrastructureContainer();
  await container.useCases.evaluateSupplement.execute({
    supplementId: product.id,
    facts: {
      composition: {
        activeIngredientAmountPerServing: PRODUCT.collagenPerDoseMg,
        referenceRangePerServing: REFERENCE_RANGE_MG,
        additives: [],
        undisclosedSubstances: [],
      },
      pricing: {
        priceInCents: PRICE.priceCents,
        dosesPerUnit: PRODUCT.servingsPerUnit,
        categoryAveragePricePerDoseInCents: categoryAveragePricePerDoseCents,
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
  await ensureCategoryAndStore();

  const container = buildInfrastructureContainer();
  const methodology = await container.ports.methodologies.findById(FALLBACK_METHODOLOGY_ID);
  if (!methodology) throw new Error(`Metodologia ${FALLBACK_METHODOLOGY_ID} não encontrada.`);
  await container.ports.methodologies.setActiveForCategory(
    CATEGORY.slug,
    FALLBACK_METHODOLOGY_ID,
    methodology.version,
  );

  await publishAndEvaluate();

  const ranking = await container.useCases.generateRanking.execute({
    categorySlug: CATEGORY.slug,
  });
  console.warn(`Ranking de ${CATEGORY.slug} gerado com ${ranking.entries.length} entradas.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
