import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Sprint de Crescimento — BCAA (categoria nova). Max Titanium BCAA
 * 2400 100 Cápsulas — composição confirmada de forma consistente:
 * 2400mg de BCAA por dose de 4 cápsulas (1200mg leucina + 600mg
 * isoleucina + 600mg valina, proporção clássica 2:1:1). Preço real
 * da Amazon. Nenhuma metodologia dedicada existe para BCAA —
 * reaproveita "creatina-methodology".
 */

const CATEGORY = { slug: "bcaa", name: "BCAA" } as const;

const PRODUCT = {
  slug: "max-titanium-bcaa-2400-100-capsulas",
  name: "Max Titanium BCAA 2400 100 Cápsulas",
  variantLabel: "100 cápsulas",
  bcaaPerDoseMg: 2400,
  servingsPerUnit: 25, // 4 cápsulas por dose, 100 cápsulas no pote
  ingredientsText:
    "BCAA (2:1:1 — 1200mg L-Leucina, 600mg L-Isoleucina, 600mg L-Valina por dose de 4 cápsulas).",
  sourceUrl: "https://www.maxtitanium.com.br/bcaa-2400-pote-com-100-capsulas/p",
} as const;

const PRICE = {
  storeSlug: "amazon-br",
  priceCents: 4071,
  url: "https://www.amazon.com.br/BCAA-2400-100-C%C3%A1psulas-Titanium/dp/B076X8666Y",
  capturedAt: "2026-09-09",
} as const;

const REFERENCE_RANGE_MG = { min: 1000, max: 5000 } as const;
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
