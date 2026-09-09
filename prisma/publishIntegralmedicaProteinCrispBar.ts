import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Sprint de Crescimento — Barras de proteína (categoria nova). Integralmédica
 * Protein Crisp Bar — 13g de proteína por barra de 45g, confirmado
 * diretamente na página do produto na Fast Fit Suplementos. Caixa com
 * 12 unidades. Nenhuma metodologia dedicada existe para Barras de
 * Proteína — reaproveita "creatina-methodology".
 */

const CATEGORY = { slug: "barras-de-proteina", name: "Barras de Proteína" } as const;

const PRODUCT = {
  slug: "integralmedica-protein-crisp-bar-caixa-12-un",
  name: "Integralmédica Protein Crisp Bar Caixa 12 Unidades 45g",
  variantLabel: "Caixa 12 unidades (45g cada)",
  proteinPerDoseGrams: 13,
  servingsPerUnit: 12, // 1 barra de 45g por dose, 12 barras na caixa
  ingredientsText:
    "Crispies de soja, proteína (whey/soja), fibras, vitaminas e minerais. 164kcal / 19g carboidratos por barra de 45g.",
  sourceUrl: "https://www.fastfitsuplementos.com.br/protein-crisp-bar-cx-12-un-45g-integral-medica",
} as const;

const PRICE = {
  storeSlug: "fastfit-suplementos",
  priceCents: 12960,
  url: "https://www.fastfitsuplementos.com.br/protein-crisp-bar-cx-12-un-45g-integral-medica",
  capturedAt: "2026-09-09",
} as const;

const REFERENCE_RANGE_GRAMS = { min: 8, max: 25 } as const;
const FALLBACK_METHODOLOGY_ID = "creatina-methodology";

async function ensureCategory() {
  await prisma.category.upsert({
    where: { slug: CATEGORY.slug },
    create: { ...CATEGORY, active: true },
    update: { name: CATEGORY.name },
  });
}

async function createProductAndSku() {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: CATEGORY.slug } });
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
        proteinPerDoseGrams: PRODUCT.proteinPerDoseGrams,
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
        dosagePerServing: PRODUCT.proteinPerDoseGrams,
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
        activeIngredientAmountPerServing: PRODUCT.proteinPerDoseGrams,
        referenceRangePerServing: REFERENCE_RANGE_GRAMS,
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
  await ensureCategory();

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
