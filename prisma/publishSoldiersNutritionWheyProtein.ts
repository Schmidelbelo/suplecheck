import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Sprint de Publicação — Soldiers Nutrition (Whey Protein).
 *
 * Mesma política aplicada à Growth: o site oficial
 * (soldiersnutrition.com.br) carrega normalmente (não é bloqueio
 * Cloudflare como na Growth), mas a tabela nutricional não é exposta
 * em texto extraível na página do produto — preço/peso/tipo/sabor
 * confirmados na própria página oficial; a composição (proteína por
 * porção) vem de uma fonte de dados nutricionais de terceiros
 * (FatSecret), extraída literalmente da tabela exibida, sem nenhum
 * cálculo/estimativa.
 */

const BRAND = { slug: "soldiers-nutrition", name: "Soldiers Nutrition" } as const;
const STORE = {
  slug: "soldiers-nutrition-oficial",
  name: "Loja Oficial Soldiers Nutrition",
} as const;

const PRODUCT = {
  slug: "soldiers-nutrition-whey-protein-concentrado-1kg",
  name: "Soldiers Nutrition Whey Protein Concentrado 1kg",
  variantLabel: "1kg",
  proteinPerDoseGrams: 40,
  servingSizeGrams: 50,
  servingsPerUnit: 20, // 1000g / 50g = 20 doses
  ingredientsText: "Concentrado proteico do soro do leite (WPC).",
  sourceUrl:
    "https://www.fatsecret.com.br/calorias-nutri%C3%A7%C3%A3o/soldiers-nutrition/whey-protein-concentrado/1-por%C3%A7%C3%A3o",
} as const;

const PRICE = {
  priceCents: 14590, // R$ 145,90 — preço promocional exibido na página oficial no momento da captura
  url: "https://soldiersnutrition.com.br/products/whey-protein-concentrado-baunilha-1kg-soldiers-nutrition",
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
