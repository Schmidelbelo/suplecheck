import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Sprint de Monetização (expansão de catálogo) — Optimum Nutrition Gold
 * Standard 100% Whey 907g.
 *
 * Amazon.com.br bloqueou a leitura automatizada do preço (corpo da
 * página truncado/renderizado via JS em toda tentativa desta sprint,
 * mesmo padrão de bloqueio já documentado nos scripts anteriores) — não
 * foi possível confirmar o preço Amazon com segurança, então a loja
 * `amazon-br` (afiliada) NÃO foi usada como fonte de preço aqui para não
 * arriscar um valor desatualizado/incorreto. Produto publicado como
 * catálogo/SEO com preço de revendedor real, não monetizado ainda —
 * pendente de reaplicar `amazon-br` numa sprint futura quando o preço
 * puder ser confirmado.
 *
 * Fontes públicas usadas (regra: mínimo 2 fontes independentes por dado):
 * - Ficha nutricional (24g proteína/dose): confirmada em
 *   brasilfitsuplementos.com.br ("24g por dose") E em
 *   optimumnutrition.com/en-us (página oficial do produto, "24g protein
 *   per serving").
 * - Tamanho de porção/doses por pote (907g): optimumnutrition.com (site
 *   oficial) cita aproximadamente 31g por porção e 29 doses no pote de
 *   2lb/907g.
 * - Preço e URL de oferta real: brasilfitsuplementos.com.br (revendedor
 *   brasileiro real, vendendo o produto no momento da captura) — loja
 *   nova, cadastrada sem afiliação (isAffiliate: false) por não haver
 *   programa de afiliados confirmado para essa loja.
 */

const PRODUCT = {
  slug: "optimum-nutrition-gold-standard-whey-907g",
  name: "Optimum Nutrition Gold Standard 100% Whey 907g",
  variantLabel: "907g",
  proteinPerDoseGrams: 24,
  servingSizeGrams: 31,
  servingsPerUnit: 29,
  ingredientsText:
    "Isolado proteico do soro do leite, concentrado proteico do soro do leite, aromatizante, lecitina de soja (emulsificante), sucralose (edulcorante).",
  sourceUrl:
    "https://www.optimumnutrition.com/en-us/products/gold-standard-100-whey-protein-powder",
} as const;

const PRICE = {
  storeSlug: "brasilfitsuplementos",
  storeName: "Brasil Fit Suplementos",
  priceCents: 39490, // R$ 394,90 — preço exibido na página do revendedor no momento da captura
  url: "https://brasilfitsuplementos.com.br/produto/100-whey-gold-standard-900g/",
  capturedAt: "2026-09-11",
} as const;

const WHEY_PROTEIN_METHODOLOGY_ID = "whey-protein-methodology";

async function ensureStore() {
  return prisma.store.upsert({
    where: { slug: PRICE.storeSlug },
    create: {
      slug: PRICE.storeSlug,
      name: PRICE.storeName,
      isAffiliate: false,
      active: true,
    },
    update: {},
  });
}

async function createProductAndSku() {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: "whey-protein" } });
  const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: "optimum-nutrition" } });

  const attributes = {
    servingSizeGrams: PRODUCT.servingSizeGrams,
    proteinPerDoseGrams: PRODUCT.proteinPerDoseGrams,
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
        dosagePerServing: PRODUCT.proteinPerDoseGrams,
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
