import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Sprint de Crescimento — ZMA (categoria nova). Growth ZMA Ultra 120
 * comprimidos — composição por dose (2 comprimidos): 260mg de
 * magnésio, 7mg de zinco, 1,3mg de vitamina B6 — confirmada de forma
 * consistente. Magnésio usado como âncora de composição por ser o
 * maior/mais citado valor do rótulo. Preço real da própria loja
 * oficial da marca (gsuplementos.com.br). Nenhuma metodologia
 * dedicada existe para ZMA — reaproveita "creatina-methodology".
 */

const CATEGORY = { slug: "zma", name: "ZMA" } as const;

const PRODUCT = {
  slug: "growth-zma-ultra-120-comprimidos",
  name: "Growth ZMA Ultra 120 Comprimidos",
  variantLabel: "120 comprimidos",
  magnesiumPerDoseMg: 260,
  servingsPerUnit: 60, // 2 comprimidos por dose, 120 comprimidos no pote
  ingredientsText:
    "Zinco (7mg/dose), magnésio (260mg/dose), vitamina B6 (1,3mg/dose), cápsula (gelatina).",
  sourceUrl: "https://www.gsuplementos.com.br/zma-ultra-120-comrimidos-growth-supplements",
} as const;

const PRICE = {
  storeSlug: "gsuplementos",
  priceCents: 6990,
  url: "https://www.gsuplementos.com.br/zma-ultra-120-comrimidos-growth-supplements",
  capturedAt: "2026-09-09",
} as const;

const REFERENCE_RANGE_MG = { min: 200, max: 450 } as const;
const FALLBACK_METHODOLOGY_ID = "creatina-methodology";

async function ensureCategoryAndStore() {
  await prisma.category.upsert({
    where: { slug: CATEGORY.slug },
    create: { ...CATEGORY, active: true },
    update: { name: CATEGORY.name },
  });

  await prisma.store.upsert({
    where: { slug: PRICE.storeSlug },
    create: { slug: PRICE.storeSlug, name: "Loja Oficial Growth Supplements", isAffiliate: false },
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
        magnesiumPerDoseMg: PRODUCT.magnesiumPerDoseMg,
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
        dosagePerServing: PRODUCT.magnesiumPerDoseMg,
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
        activeIngredientAmountPerServing: PRODUCT.magnesiumPerDoseMg,
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
