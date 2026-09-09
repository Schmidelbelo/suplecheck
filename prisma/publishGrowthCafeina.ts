import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Sprint de Crescimento — Cafeína (1º produto da categoria, categoria
 * nova). Growth Cafeína 100mg — composição (100mg/cápsula) confirmada
 * de forma unânime em todas as fontes consultadas (Captain Supplements,
 * Virtual Suplementos, Essência Brasileira, Shopee, loja própria
 * gsuplementos.com.br). Preço real da Essência Brasileira (retailer
 * autorizado). Nenhuma metodologia dedicada existe para Cafeína —
 * reaproveita "creatina-methodology" como fallback, mesmo padrão já
 * usado para Ômega-3 e Pré-treino.
 */

const CATEGORY = { slug: "cafeina", name: "Cafeína" } as const;

const PRODUCT = {
  slug: "growth-cafeina-100mg-120-capsulas",
  name: "Growth Cafeína 100mg 120 Cápsulas",
  variantLabel: "120 cápsulas",
  caffeinePerDoseMg: 100,
  servingsPerUnit: 120, // 1 cápsula por dose, 120 cápsulas no pote
  ingredientsText:
    "Cafeína anidra, celulose microcristalina, polivinilpirrolidona, estearato de magnésio, dióxido de silício.",
  sourceUrl:
    "https://www.essenciabrasileira.com.br/produto/growth-supplements-cafeina-100mg-120caps/",
} as const;

const PRICE = {
  storeSlug: "essencia-brasileira",
  priceCents: 3990,
  url: "https://www.essenciabrasileira.com.br/produto/growth-supplements-cafeina-100mg-120caps/",
  capturedAt: "2026-09-09",
} as const;

const REFERENCE_RANGE_MG = { min: 50, max: 400 } as const;
const FALLBACK_METHODOLOGY_ID = "creatina-methodology";

async function ensureCategoryAndStore() {
  await prisma.category.upsert({
    where: { slug: CATEGORY.slug },
    create: { ...CATEGORY, active: true },
    update: { name: CATEGORY.name },
  });

  await prisma.store.upsert({
    where: { slug: PRICE.storeSlug },
    create: { slug: PRICE.storeSlug, name: "Essência Brasileira", isAffiliate: false },
    update: {},
  });
}

async function createProductAndSku() {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: CATEGORY.slug } });
  const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: "growth-supplements" } });

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
        activeIngredientAmountPerServing: PRODUCT.caffeinePerDoseMg,
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
