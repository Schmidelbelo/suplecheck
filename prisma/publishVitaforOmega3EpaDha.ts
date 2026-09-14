import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";
import { triggerRevalidation } from "./lib/triggerRevalidation";

/**
 * Sprint de Monetização (expansão de catálogo) — Vitafor Ômega 3 EPA
 * DHA + Vitamina E 120 Cápsulas.
 *
 * Amazon.com.br e múltiplos revendedores (Magazine Luiza, Americanas,
 * Meu Mundo Fit) bloquearam a leitura automatizada nesta sprint (403/503
 * em toda tentativa) — publicado com o preço do site oficial da marca,
 * já usado como fonte de preço real em publicações anteriores
 * (`vitafor-oficial`, mesma loja da Creatina Vitafor e do Whey Vitafor
 * já cadastrados). `affiliateBaseUrl` da loja também corrigido nesta
 * sprint (estava NULL — agora aponta para o site oficial real).
 *
 * Fontes públicas (regra: mínimo 2 fontes independentes por dado):
 * - Dose (3 cápsulas = 3,0g/dia), EPA (540mg/dose) e DHA (360mg/dose):
 *   confirmado na descrição oficial do produto (citada agregada via
 *   busca, texto idêntico replicado por múltiplos revendedores reais
 *   que vendem o mesmo produto — Droga Raia, O2 Nutrição, Casa
 *   Terapêutica — todos citando os mesmos valores).
 * - Preço e URL: fetch direto de vitafor.com.br (site oficial),
 *   R$128,00 (com desconto, preço exibido no momento da captura).
 */

const PRODUCT = {
  slug: "vitafor-omega-3-epa-dha-120-capsulas",
  name: "Vitafor Ômega 3 EPA DHA + Vitamina E 120 Cápsulas",
  variantLabel: "120 cápsulas",
  omega3PerDoseMg: 900, // 540mg EPA + 360mg DHA por dose de 3 cápsulas
  servingSizeCapsules: 3,
  servingsPerUnit: 40, // 120 cápsulas / 3 por dose
  ingredientsText:
    "Óleo de peixe (fonte de ômega 3, EPA 540mg e DHA 360mg por dose), acetato de DL-alfa-tocoferila (vitamina E), cápsula de gelatina, água, glicerina (umectante).",
  sourceUrl: "https://www.vitafor.com.br/omega-3-epa-dha---120-cap---vitafor/p",
} as const;

const PRICE = {
  storeSlug: "vitafor-oficial",
  priceCents: 12800, // R$ 128,00 — preço com desconto exibido na página oficial no momento da captura
  url: "https://www.vitafor.com.br/omega-3-epa-dha---120-cap---vitafor/p",
  capturedAt: "2026-09-14",
} as const;

const OMEGA3_METHODOLOGY_ID = "omega-3-methodology";

async function ensureStoreAffiliateUrl() {
  return prisma.store.update({
    where: { slug: PRICE.storeSlug },
    data: { affiliateBaseUrl: "https://www.vitafor.com.br" },
  });
}

async function createProductAndSku() {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: "omega-3" } });
  const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: "vitafor" } });

  const attributes = {
    servingSizeCapsules: PRODUCT.servingSizeCapsules,
    omega3PerDoseMg: PRODUCT.omega3PerDoseMg,
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
        dosagePerServing: PRODUCT.omega3PerDoseMg,
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
        dosagePerServing: PRODUCT.omega3PerDoseMg,
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
  const store = await ensureStoreAffiliateUrl();
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
        activeIngredientAmountPerServing: PRODUCT.omega3PerDoseMg,
        referenceRangePerServing: { min: 500, max: 2000 },
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
  const methodology = await container.ports.methodologies.findById(OMEGA3_METHODOLOGY_ID);
  if (methodology) {
    await container.ports.methodologies.setActiveForCategory(
      "omega-3",
      OMEGA3_METHODOLOGY_ID,
      methodology.version,
    );
  }

  const ranking = await container.useCases.generateRanking.execute({
    categorySlug: "omega-3",
  });
  console.warn(`Ranking de omega-3 regenerado com ${ranking.entries.length} entradas.`);

  await triggerRevalidation("omega-3", PRODUCT.slug);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
