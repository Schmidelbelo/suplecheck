import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";
import { triggerRevalidation } from "./lib/triggerRevalidation";

/**
 * Sprint de Monetização (expansão de catálogo) — Dux Cafeína 90
 * Cápsulas.
 *
 * Amazon.com.br bloqueou leitura automatizada do preço nesta sprint
 * (mesmo padrão documentado) — publicado com preço do site oficial
 * (`dux-oficial`, loja já cadastrada e já com `affiliateBaseUrl` real
 * de sprints anteriores).
 *
 * Fontes públicas (regra: mínimo 2 fontes independentes por dado):
 * - Cafeína por dose (200mg, 1 cápsula/dose, 90 doses/pote): confirmado
 *   via fetch direto de duxhumanhealth.com (site oficial) E via listagem
 *   220nutrition.com.br (revendedor real, mesmo valor "200MG" no
 *   título) — descartei a menção a "210mg" vista em fontes de menor
 *   confiança (Fortão Suplementos), por divergir da fonte oficial.
 * - Preço e URL: fetch direto de duxhumanhealth.com, R$59,90 (com
 *   desconto, preço exibido no momento da captura).
 */

const PRODUCT = {
  slug: "dux-cafeina-90-capsulas",
  name: "Dux Cafeína 90 Cápsulas",
  variantLabel: "90 cápsulas",
  caffeinePerDoseMg: 200,
  servingSizeCapsules: 1,
  servingsPerUnit: 90,
  ingredientsText: "Cafeína anidra (pureza superior a 98,5%), cápsula softgel.",
  sourceUrl: "https://www.duxhumanhealth.com/cafeina-pote90caps/p",
} as const;

const PRICE = {
  storeSlug: "dux-oficial",
  priceCents: 5990, // R$ 59,90 — preço com desconto exibido na página oficial no momento da captura
  url: "https://www.duxhumanhealth.com/cafeina-pote90caps/p",
  capturedAt: "2026-09-14",
} as const;

const CAFEINA_METHODOLOGY_ID = "cafeina-methodology";

async function createProductAndSku() {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: "cafeina" } });
  const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: "dux" } });

  const attributes = {
    servingSizeCapsules: PRODUCT.servingSizeCapsules,
    caffeinePerDoseMg: PRODUCT.caffeinePerDoseMg,
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
        dosagePerServing: PRODUCT.caffeinePerDoseMg,
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
        dosagePerServing: PRODUCT.caffeinePerDoseMg,
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
  const store = await prisma.store.findUniqueOrThrow({ where: { slug: PRICE.storeSlug } });
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
        activeIngredientAmountPerServing: PRODUCT.caffeinePerDoseMg,
        referenceRangePerServing: { min: 100, max: 400 },
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
  const methodology = await container.ports.methodologies.findById(CAFEINA_METHODOLOGY_ID);
  if (methodology) {
    await container.ports.methodologies.setActiveForCategory(
      "cafeina",
      CAFEINA_METHODOLOGY_ID,
      methodology.version,
    );
  }

  const ranking = await container.useCases.generateRanking.execute({
    categorySlug: "cafeina",
  });
  console.warn(`Ranking de cafeína regenerado com ${ranking.entries.length} entradas.`);

  await triggerRevalidation("cafeina", PRODUCT.slug);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
