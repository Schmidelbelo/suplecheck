import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Sprint de Crescimento — 2º produto em Hipercalóricos. Integralmédica
 * Sinister Mass 3kg — 599 kcal por dose de 160g (4 scoops), confirmado
 * pelo FatSecret (base de dados nutricional). Preço real do Mercado
 * Livre. Categoria "hipercaloricos" já ativa (metodologia já
 * configurada).
 */

const CATEGORY_SLUG = "hipercaloricos";

const PRODUCT = {
  slug: "integralmedica-sinister-mass-3kg",
  name: "Integralmédica Sinister Mass 3kg",
  variantLabel: "3kg",
  kcalPerDose: 599,
  servingsPerUnit: 18, // 3000g / 160g por dose ≈ 18 doses
  ingredientsText:
    "Whey protein concentrado e isolado, maltodextrina, waxy maize, creatina (dose de 160g / 4 scoops).",
  sourceUrl:
    "https://www.fatsecret.com.br/calorias-nutri%C3%A7%C3%A3o/integralmedica/sinister-mass/4-scoops",
} as const;

const PRICE = {
  storeSlug: "mercado-livre",
  priceCents: 11043,
  url: "https://produto.mercadolivre.com.br/MLB-962580047-hipercalorico-sinister-mass-3kg-integralmedica-brinde-_JM",
  capturedAt: "2026-09-09",
} as const;

const REFERENCE_RANGE_KCAL = { min: 300, max: 1000 } as const;
const FALLBACK_METHODOLOGY_ID = "creatina-methodology";

async function createProductAndSku() {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: CATEGORY_SLUG } });
  const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: "integralmedica" } });

  const product = await prisma.product.upsert({
    where: { slug: PRODUCT.slug },
    create: {
      slug: PRODUCT.slug,
      name: PRODUCT.name,
      categoryId: category.id,
      brandId: brand.id,
      status: "DRAFT",
      attributes: {
        kcalPerDose: PRODUCT.kcalPerDose,
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
        dosagePerServing: PRODUCT.kcalPerDose,
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
        activeIngredientAmountPerServing: PRODUCT.kcalPerDose,
        referenceRangePerServing: REFERENCE_RANGE_KCAL,
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
