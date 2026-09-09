import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Sprint de Crescimento — 2º produto em Melatonina. Neo Química
 * Melatonina 0,21mg 90 Comprimidos Sublinguais — dose regulatória máxima
 * ANVISA (0,21mg/comprimido), consistente com o produto Growth já
 * publicado. Preço real da Amazon. Categoria "melatonina" já ativa
 * (metodologia já configurada).
 */

const CATEGORY_SLUG = "melatonina";

const PRODUCT = {
  slug: "neo-quimica-melatonina-021mg-90-comprimidos",
  name: "Neo Química Melatonina 0,21mg 90 Comprimidos Sublinguais",
  variantLabel: "90 comprimidos",
  melatoninPerDoseMg: 0.21,
  servingsPerUnit: 90, // 1 comprimido por dose
  ingredientsText: "Melatonina, sabor maracujá, comprimido sublingual.",
  sourceUrl:
    "https://www.amazon.com.br/Suplemento-Alimentar-Melatonina-Vitaminas-c%C3%A1psulas/dp/B0B5S7L3VN",
} as const;

const PRICE = {
  storeSlug: "amazon-br",
  priceCents: 2360,
  url: "https://www.amazon.com.br/Suplemento-Alimentar-Melatonina-Vitaminas-c%C3%A1psulas/dp/B0B5S7L3VN",
  capturedAt: "2026-09-09",
} as const;

const REFERENCE_RANGE_MG = { min: 0.1, max: 5 } as const;
const FALLBACK_METHODOLOGY_ID = "creatina-methodology";

async function ensureBrand() {
  await prisma.brand.upsert({
    where: { slug: "neo-quimica" },
    create: { slug: "neo-quimica", name: "Neo Química", active: true },
    update: {},
  });
}

async function createProductAndSku() {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: CATEGORY_SLUG } });
  const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: "neo-quimica" } });

  const product = await prisma.product.upsert({
    where: { slug: PRODUCT.slug },
    create: {
      slug: PRODUCT.slug,
      name: PRODUCT.name,
      categoryId: category.id,
      brandId: brand.id,
      status: "DRAFT",
      attributes: {
        melatoninPerDoseMg: PRODUCT.melatoninPerDoseMg,
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
        dosagePerServing: PRODUCT.melatoninPerDoseMg,
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
        activeIngredientAmountPerServing: PRODUCT.melatoninPerDoseMg,
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
  await ensureBrand();

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
