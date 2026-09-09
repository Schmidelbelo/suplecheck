import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Sprint de Publicação — New Millen (Whey Protein).
 *
 * Única marca, dentre as 5 pesquisadas na sprint "Whey Protein Oficial",
 * com dado de composição 100% confirmado na própria página oficial
 * (proteína-por-dose exata, peso, tipo, sabores) — ver relatório da
 * sprint de pesquisa. Preço e URL capturados diretamente da loja oficial
 * (loja.newmillen.com.br) nesta sprint.
 *
 * Growth e Soldiers Nutrition permanecem DRAFT — resolução é a próxima
 * sprint, não esta.
 */

const BRAND = { slug: "new-millen", name: "New Millen" } as const;
const STORE = { slug: "new-millen-oficial", name: "Loja Oficial New Millen" } as const;

const PRODUCT = {
  slug: "new-millen-whey-100-900g",
  name: "New Millen Whey 100% 900g",
  variantLabel: "900g",
  proteinPerDoseGrams: 21,
  servingSizeGrams: 30,
  servingsPerUnit: 30, // 900g / 30g = 30 doses
  ingredientsText:
    "Concentrado proteico do soro do leite (WPC), BCAA, glutamina, espessantes, edulcorantes e aromatizante.",
  sourceUrl: "https://www.newmillen.com.br/",
} as const;

const PRICE = {
  priceCents: 17040, // R$ 170,40 — preço promocional exibido na página no momento da captura
  url: "https://loja.newmillen.com.br/produtos/whey-100-pote-900g/",
  capturedAt: "2026-09-09",
} as const;

const WHEY_PROTEIN_METHODOLOGY_ID = "whey-protein-methodology";

async function ensureBrandAndStore() {
  await prisma.brand.upsert({
    where: { slug: BRAND.slug },
    create: BRAND,
    update: { name: BRAND.name },
  });

  await prisma.store.upsert({
    where: { slug: STORE.slug },
    create: { ...STORE, isAffiliate: false },
    update: { name: STORE.name },
  });
}

async function createProductAndSku() {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: "whey-protein" } });
  const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: BRAND.slug } });

  const product = await prisma.product.upsert({
    where: { slug: PRODUCT.slug },
    create: {
      slug: PRODUCT.slug,
      name: PRODUCT.name,
      categoryId: category.id,
      brandId: brand.id,
      status: "DRAFT",
      attributes: {
        servingSizeGrams: PRODUCT.servingSizeGrams,
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

/** Média real de preço-por-dose entre os produtos de whey protein já publicados — nunca um valor fixo/estimado. */
async function computeCategoryAveragePricePerDoseCents(categoryId: string): Promise<number> {
  const publishedSkus = await prisma.sku.findMany({
    where: { product: { categoryId, status: "PUBLISHED" } },
    select: {
      servingsPerUnit: true,
      priceEntries: { orderBy: { capturedAt: "desc" }, take: 1, select: { priceCents: true } },
    },
  });

  const perDose = publishedSkus
    .map((sku) => {
      const latest = sku.priceEntries[0];
      if (!latest || !sku.servingsPerUnit) return null;
      return latest.priceCents / sku.servingsPerUnit;
    })
    .filter((value): value is number => value !== null);

  if (perDose.length === 0) return Math.round(PRICE.priceCents / PRODUCT.servingsPerUnit);
  return Math.round(perDose.reduce((sum, v) => sum + v, 0) / perDose.length);
}

async function publishAndEvaluate() {
  const { product, sku } = await createProductAndSku();
  const store = await prisma.store.findUniqueOrThrow({ where: { slug: STORE.slug } });

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
  );

  const container = buildInfrastructureContainer();
  await container.useCases.evaluateSupplement.execute({
    supplementId: product.id,
    facts: {
      composition: {
        activeIngredientAmountPerServing: PRODUCT.proteinPerDoseGrams,
        referenceRangePerServing: { min: 18, max: 30 },
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
  await ensureBrandAndStore();
  await publishAndEvaluate();

  const container = buildInfrastructureContainer();
  await container.ports.methodologies.setActiveForCategory(
    "whey-protein",
    WHEY_PROTEIN_METHODOLOGY_ID,
    (await container.ports.methodologies.findById(WHEY_PROTEIN_METHODOLOGY_ID))!.version,
  );

  const ranking = await container.useCases.generateRanking.execute({
    categorySlug: "whey-protein",
  });
  console.warn(`Ranking de whey-protein regenerado com ${ranking.entries.length} entradas.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
