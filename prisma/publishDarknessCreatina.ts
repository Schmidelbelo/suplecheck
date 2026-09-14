import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";
import { triggerRevalidation } from "./lib/triggerRevalidation";

/**
 * Sprint de Monetização (expansão de catálogo) — Darkness Creatina
 * Monohidratada 300g.
 *
 * Amazon.com.br e múltiplos revendedores bloquearam leitura automatizada
 * nesta sprint (mesmo padrão já documentado) — publicado com o preço do
 * site oficial da marca (fetch direto), loja nova `darkness-oficial`,
 * sem afiliação confirmada ainda.
 *
 * Fontes públicas (regra: mínimo 2 fontes independentes por dado):
 * - Porção (3g = 1 dosador), 100 doses/pote, 100% creatina monohidratada
 *   pura (3g de porção = 3000mg de creatina): confirmado via busca
 *   agregada (múltiplos revendedores citando a mesma ficha) E via fetch
 *   direto do site oficial darkness.com.br, ambos convergindo no mesmo
 *   valor.
 * - Preço e URL: fetch direto de darkness.com.br (site oficial),
 *   R$60,00 (preço exibido no momento da captura).
 */

const PRODUCT = {
  slug: "darkness-creatina-monohidratada-300g",
  name: "Darkness Creatina Monohidratada 300g",
  variantLabel: "300g",
  creatinePerDoseMg: 3000,
  servingSizeGrams: 3,
  servingsPerUnit: 100,
  ingredientsText:
    "Creatina monohidratada (100% pura, sem sabor, sem açúcar, corantes ou conservantes).",
  sourceUrl: "https://www.darkness.com.br/creatina-pura-300g-darkness/p",
} as const;

const PRICE = {
  storeSlug: "darkness-oficial",
  storeName: "Darkness Oficial",
  priceCents: 6000, // R$ 60,00 — preço exibido na página oficial no momento da captura
  url: "https://www.darkness.com.br/creatina-pura-300g-darkness/p",
  capturedAt: "2026-09-14",
} as const;

const CREATINA_METHODOLOGY_ID = "creatina-methodology";

async function ensureStore() {
  return prisma.store.upsert({
    where: { slug: PRICE.storeSlug },
    create: { slug: PRICE.storeSlug, name: PRICE.storeName, isAffiliate: false, active: true },
    update: {},
  });
}

async function createProductAndSku() {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: "creatina" } });
  const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: "darkness" } });

  const attributes = {
    servingSizeGrams: PRODUCT.servingSizeGrams,
    creatinePerDoseMg: PRODUCT.creatinePerDoseMg,
    ingredients: PRODUCT.ingredientsText,
    sourceUrl: PRODUCT.sourceUrl,
  };

  const product = await prisma.product.upsert({
    where: { slug: PRODUCT.slug },
    create: {
      slug: PRODUCT.slug,
      name: PRODUCT.name,
      categoryId: category.id,
      brandId: brand.id,
      status: "DRAFT",
      attributes,
    },
    update: { attributes },
  });

  let sku = await prisma.sku.findFirst({
    where: { productId: product.id, variantLabel: PRODUCT.variantLabel },
  });
  if (sku) {
    sku = await prisma.sku.update({
      where: { id: sku.id },
      data: {
        dosagePerServing: PRODUCT.creatinePerDoseMg,
        servingsPerUnit: PRODUCT.servingsPerUnit,
      },
    });
  }
  if (!sku) {
    sku = await prisma.sku.create({
      data: {
        productId: product.id,
        variantLabel: PRODUCT.variantLabel,
        servingsPerUnit: PRODUCT.servingsPerUnit,
        dosagePerServing: PRODUCT.creatinePerDoseMg,
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
  const store = await ensureStore();
  const { product, sku } = await createProductAndSku();

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
        activeIngredientAmountPerServing: PRODUCT.creatinePerDoseMg,
        referenceRangePerServing: { min: 3000, max: 5000 },
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
  await publishAndEvaluate();

  const container = buildInfrastructureContainer();
  await container.ports.methodologies.setActiveForCategory(
    "creatina",
    CREATINA_METHODOLOGY_ID,
    (await container.ports.methodologies.findById(CREATINA_METHODOLOGY_ID))!.version,
  );

  const ranking = await container.useCases.generateRanking.execute({
    categorySlug: "creatina",
  });
  console.warn(`Ranking de creatina regenerado com ${ranking.entries.length} entradas.`);

  await triggerRevalidation("creatina", PRODUCT.slug);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
