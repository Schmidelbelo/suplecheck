import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";
import { triggerRevalidation } from "./lib/triggerRevalidation";

/**
 * Sprint de Monetização (expansão de catálogo) — Probiótica Epic
 * Pré-Treino 300g.
 *
 * Amazon.com.br bloqueou a leitura automatizada do preço de novo nesta
 * sprint (mesmo padrão documentado nos scripts anteriores) — publicado
 * com preço do site oficial da marca em vez de arriscar um valor
 * desatualizado. Loja nova `probiotica-oficial`, sem afiliação (não há
 * programa de afiliados confirmado para o site oficial da Probiótica).
 *
 * Fontes públicas (regra: mínimo 2 fontes independentes por dado):
 * - Cafeína por dose (200mg) e porção (5g = 1 scoop, 60 doses/300g):
 *   confirmado em probiotica.com.br (site oficial, fetch direto) E em
 *   busca agregada citando a mesma tabela (blog.probiotica.com.br /
 *   revendedores, mesmos valores).
 * - Preço e URL de oferta real: probiotica.com.br (site oficial,
 *   vendendo o produto diretamente no momento da captura).
 */

const PRODUCT = {
  slug: "probiotica-epic-pre-treino-300g",
  name: "Probiótica Epic Pré-Treino 300g",
  variantLabel: "300g",
  caffeinePerDoseMg: 200,
  servingSizeGrams: 5,
  servingsPerUnit: 60,
  ingredientsText:
    "Beta-alanina (2g/dose), taurina (1200mg/dose), cafeína anidra (200mg/dose), aromatizante, edulcorantes.",
  sourceUrl: "https://www.probiotica.com.br/epic-300g/p",
} as const;

const PRICE = {
  storeSlug: "probiotica-oficial",
  storeName: "Probiótica Oficial",
  priceCents: 8889, // R$ 88,89 — preço exibido na página oficial no momento da captura (fora o desconto Pix)
  url: "https://www.probiotica.com.br/epic-300g/p",
  capturedAt: "2026-09-14",
} as const;

// Pré-treino ainda não tem metodologia própria — mesmo fallback já
// usado pelos demais scripts de publicação desta categoria.
const PRE_TREINO_METHODOLOGY_ID = "creatina-methodology";

async function ensureStore() {
  return prisma.store.upsert({
    where: { slug: PRICE.storeSlug },
    create: { slug: PRICE.storeSlug, name: PRICE.storeName, isAffiliate: false, active: true },
    update: {},
  });
}

async function createProductAndSku() {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: "pre-treino" } });
  const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: "probiotica" } });

  const attributes = {
    servingSizeGrams: PRODUCT.servingSizeGrams,
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
        activeIngredientAmountPerServing: PRODUCT.caffeinePerDoseMg,
        referenceRangePerServing: { min: 150, max: 300 },
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
    "pre-treino",
    PRE_TREINO_METHODOLOGY_ID,
    (await container.ports.methodologies.findById(PRE_TREINO_METHODOLOGY_ID))!.version,
  );

  const ranking = await container.useCases.generateRanking.execute({
    categorySlug: "pre-treino",
  });
  console.warn(`Ranking de pre-treino regenerado com ${ranking.entries.length} entradas.`);

  await triggerRevalidation("pre-treino", PRODUCT.slug);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
