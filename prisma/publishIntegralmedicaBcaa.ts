import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Sprint de Crescimento — 2º produto em BCAA. Integralmédica Aminoácidos
 * Essenciais BCAA 2044mg 90 Cápsulas — 2044mg de BCAA por dose de 4
 * cápsulas (1022mg Leu + 511mg Iso + 511mg Val), confirmado no site
 * oficial integralmedica.com.br. Preço real da Vitaminas Brasil.
 * Categoria "bcaa" já ativa (metodologia já configurada).
 */

const CATEGORY_SLUG = "bcaa";

const PRODUCT = {
  slug: "integralmedica-bcaa-2044mg-90-capsulas",
  name: "Integralmédica Aminoácidos Essenciais BCAA 2044mg 90 Cápsulas",
  variantLabel: "90 cápsulas",
  bcaaPerDoseMg: 2044,
  servingsPerUnit: 22, // 4 cápsulas por dose (2044mg total: 1022mg Leu + 511mg Iso + 511mg Val), 90 cápsulas no pote
  ingredientsText:
    "BCAA (1022mg L-Leucina, 511mg L-Isoleucina, 511mg L-Valina) — 2044mg por dose de 4 cápsulas.",
  sourceUrl: "https://www.amazon.com.br/Integralmedica-BCAA-2044-90-Caps/dp/B07HV4QZC8",
} as const;

const PRICE = {
  storeSlug: "vitaminas-brasil",
  priceCents: 5326,
  url: "https://www.vitaminasbrasil.com/bcaa-2044mg-90-capsulas-integral-medica",
  capturedAt: "2026-09-09",
} as const;

const REFERENCE_RANGE_MG = { min: 1000, max: 5000 } as const;
const FALLBACK_METHODOLOGY_ID = "creatina-methodology";

async function ensureStore() {
  await prisma.store.upsert({
    where: { slug: PRICE.storeSlug },
    create: { slug: PRICE.storeSlug, name: "Vitaminas Brasil", isAffiliate: false },
    update: {},
  });
}

async function createProductAndSku() {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: CATEGORY_SLUG } });
  const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: "integralmedica" } });

  const product = await prisma.product.upsert({
    where: { slug: PRODUCT.slug },
    create: {
      slug: PRODUCT.slug,
      name: PRODUCT.name,
      categoryId: category.id,
      brandId: brand.id,
      status: "DRAFT",
      attributes: {
        bcaaPerDoseMg: PRODUCT.bcaaPerDoseMg,
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
        dosagePerServing: PRODUCT.bcaaPerDoseMg,
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
        activeIngredientAmountPerServing: PRODUCT.bcaaPerDoseMg,
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
  await ensureStore();

  const container = buildInfrastructureContainer();
  const methodology = await container.ports.methodologies.findById(FALLBACK_METHODOLOGY_ID);
  if (!methodology) throw new Error(`Metodologia ${FALLBACK_METHODOLOGY_ID} não encontrada.`);
  await container.ports.methodologies.setActiveForCategory(
    CATEGORY_SLUG,
    FALLBACK_METHODOLOGY_ID,
    methodology.version,
  );

  await publishAndEvaluate();

  const ranking = await container.useCases.generateRanking.execute({
    categorySlug: CATEGORY_SLUG,
  });
  console.warn(`Ranking de ${CATEGORY_SLUG} gerado com ${ranking.entries.length} entradas.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
