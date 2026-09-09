import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Sprint de Crescimento — 2º produto em Pasta de Amendoim. Nutrata Pasta
 * de Amendoim Paçoca 600g com Whey Protein — 3,6g de proteína por
 * porção de 15g, confirmado na loja oficial (loja.nutrata.com.br).
 * Preço real da loja oficial. Categoria "pasta-de-amendoim" já ativa
 * (metodologia já configurada).
 */

const CATEGORY_SLUG = "pasta-de-amendoim";

const PRODUCT = {
  slug: "nutrata-pasta-de-amendoim-pacoca-600g",
  name: "Nutrata Pasta de Amendoim Paçoca 600g com Whey Protein",
  variantLabel: "600g",
  proteinPerDoseGrams: 3.6,
  servingsPerUnit: 40, // 600g / 15g por porção = 40 porções
  ingredientsText:
    "Amendoim, whey protein, pedaços crocantes de paçoca, zero adição de açúcar, sem glúten (porção de 15g / 1 colher de sopa).",
  sourceUrl: "https://loja.nutrata.com.br/nutrata-pasta-de-amendoim-600g-pacoca",
} as const;

const PRICE = {
  storeSlug: "nutrata-oficial",
  priceCents: 8800,
  url: "https://loja.nutrata.com.br/nutrata-pasta-de-amendoim-600g-pacoca",
  capturedAt: "2026-09-09",
} as const;

const REFERENCE_RANGE_GRAMS = { min: 2, max: 10 } as const;
const FALLBACK_METHODOLOGY_ID = "creatina-methodology";

async function ensureStore() {
  await prisma.store.upsert({
    where: { slug: PRICE.storeSlug },
    create: { slug: PRICE.storeSlug, name: "Nutrata (Loja Oficial)", isAffiliate: false },
    update: {},
  });
}

async function createProductAndSku() {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: CATEGORY_SLUG } });
  const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: "nutrata" } });

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
