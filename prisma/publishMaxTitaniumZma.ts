import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Sprint de Crescimento — 2º produto em ZMA. Max Titanium ZMA 90
 * Cápsulas — 258mg de magnésio por dose de 2 cápsulas (também 7,0mg
 * zinco + 1,3mg B6), confirmado no título oficial do produto
 * (maxtitanium.com.br). Preço real da Nutri Fast Shop. Categoria
 * "zma" já ativa (metodologia já configurada). Magnésio usado como
 * âncora de composição (maior/mais citado valor do rótulo, mesmo
 * critério usado no ZMA da Growth já publicado).
 */

const CATEGORY_SLUG = "zma";

const PRODUCT = {
  slug: "max-titanium-zma-90-capsulas",
  name: "Max Titanium ZMA 90 Cápsulas",
  variantLabel: "90 cápsulas",
  magnesiumPerDoseMg: 258,
  servingsPerUnit: 45, // 2 cápsulas por dose, 90 cápsulas no pote
  ingredientsText:
    "Bisglicinato de magnésio, bisglicinato de zinco, piridoxina (vitamina B6) — 258mg magnésio + 7,0mg zinco + 1,3mg B6 por dose de 2 cápsulas.",
  sourceUrl: "https://www.maxtitanium.com.br/zma-90-caps-max-titanium/p",
} as const;

const PRICE = {
  storeSlug: "nutri-fast-shop",
  priceCents: 5990,
  url: "https://www.nutrifastshop.com.br/suplementos-alimentares/massa-muscular/pre-hormonais/testosterona/zma-max-titanium/",
  capturedAt: "2026-09-09",
} as const;

const REFERENCE_RANGE_MG = { min: 100, max: 450 } as const;
const FALLBACK_METHODOLOGY_ID = "creatina-methodology";

async function createProductAndSku() {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: CATEGORY_SLUG } });
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
        magnesiumPerDoseMg: PRODUCT.magnesiumPerDoseMg,
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
        dosagePerServing: PRODUCT.magnesiumPerDoseMg,
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
        activeIngredientAmountPerServing: PRODUCT.magnesiumPerDoseMg,
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
