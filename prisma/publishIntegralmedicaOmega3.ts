import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Sprint de Crescimento — Ômega-3 (1º produto da categoria).
 *
 * Categoria "omega-3" existia ativa no catálogo desde a criação do
 * seed inicial, mas sem nenhum produto associado até esta sprint.
 * Nenhuma metodologia dedicada a Ômega-3 existe ainda — reaproveita
 * "creatina-methodology" como fallback, mesmo padrão já usado em
 * `publishPreTreinoOfficialCategory.ts` para Pré-treino.
 *
 * Marca: Integralmédica (já cadastrada). Composição confirmada por
 * múltiplas fontes concordantes (site da marca via busca, retailers
 * Amazon/Droga Raia/Extra): 1360mg de Ômega-3 por dose (2 cápsulas),
 * sendo 840mg EPA + 521mg DHA, 60 cápsulas por frasco = 30 doses.
 * Preço/URL real capturados na Amazon.
 */

const PRODUCT = {
  slug: "integralmedica-omega-3-1360mg-60-capsulas",
  name: "Integralmédica Ômega 3 1360mg 60 Cápsulas",
  variantLabel: "60 cápsulas",
  activeIngredientPerDoseMg: 1360, // 840mg EPA + 521mg DHA por dose de 2 cápsulas
  servingsPerUnit: 30, // 60 cápsulas / 2 por dose = 30 doses
  ingredientsText:
    "Óleo de peixe (fonte de EPA e DHA em triglicerídeos), DL alfatocoferol (vitamina E), cápsula: água purificada, gelatina, glicerina.",
  sourceUrl: "https://www.integralmedica.com.br/",
} as const;

const PRICE = {
  storeSlug: "amazon-br",
  priceCents: 11990, // R$ 119,90 — preço confirmado na Amazon no momento da captura
  url: "https://www.amazon.com.br/Integralmedica-Integralm%C3%A9dica-%C3%94mega-3-60-c%C3%A1psulas/dp/B081VQZ1YK",
  capturedAt: "2026-09-09",
} as const;

// Faixa geral de referência para suplementação de EPA+DHA combinados —
// 250mg (mínimo frequentemente citado para benefício geral) a 3000mg
// (limite superior usual citado para uso seguro sem supervisão
// clínica) — não é uma faixa terapêutica específica, é o mesmo tipo de
// faixa pragmática já usada para creatina (`{min:18,max:30}`) e
// pré-treino nos scripts anteriores.
const REFERENCE_RANGE_MG = { min: 250, max: 3000 } as const;

const FALLBACK_METHODOLOGY_ID = "creatina-methodology";

async function createProductAndSku() {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: "omega-3" } });
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
        activeIngredientPerDoseMg: PRODUCT.activeIngredientPerDoseMg,
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
        dosagePerServing: PRODUCT.activeIngredientPerDoseMg,
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
        activeIngredientAmountPerServing: PRODUCT.activeIngredientPerDoseMg,
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
    "omega-3",
    FALLBACK_METHODOLOGY_ID,
    methodology.version,
  );

  await publishAndEvaluate();

  const ranking = await container.useCases.generateRanking.execute({ categorySlug: "omega-3" });
  console.warn(`Ranking de omega-3 gerado com ${ranking.entries.length} entradas.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
