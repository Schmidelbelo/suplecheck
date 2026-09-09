import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Sprint de Crescimento — resolve o bloqueio da Darkness Évora PW
 * Limão 150g em Pré-treino. Composição já estava 100% confirmada em
 * ficha técnica oficial (sprint anterior) — o único motivo do DRAFT
 * era preço oficial não confirmado (`draftReason`). Preço/URL real
 * capturados na Amazon nesta sprint. Nenhum dado de composição já
 * existente foi alterado.
 */

const PRODUCT_SLUG = "darkness-evora-pw-limao-150g";

const PRICE = {
  storeSlug: "amazon-br",
  priceCents: 4767, // R$ 47,67 — preço confirmado na Amazon no momento da captura
  url: "https://www.amazon.com.br/%C3%89vora-PW-150g-Lim%C3%A3o-Darkness/dp/B09C81ML7Z",
  capturedAt: "2026-09-09",
} as const;

const PRE_TREINO_METHODOLOGY_ID = "creatina-methodology"; // fallback já usado pela categoria (ver sprint de Pré-treino)

interface ProductAttributes {
  servingsPerUnit: number;
  servingSizeGrams: number;
  caffeineMg: number;
  [key: string]: unknown;
}

async function publishAndEvaluate() {
  const product = await prisma.product.findUniqueOrThrow({ where: { slug: PRODUCT_SLUG } });
  const attributes = product.attributes as unknown as ProductAttributes;
  const sku = await prisma.sku.findFirstOrThrow({ where: { productId: product.id } });
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

  const publishedSkus = await prisma.sku.findMany({
    where: { product: { categoryId: product.categoryId, status: "PUBLISHED" } },
    select: {
      servingsPerUnit: true,
      priceEntries: { orderBy: { capturedAt: "desc" }, take: 1, select: { priceCents: true } },
    },
  });
  const perDose = publishedSkus
    .map((s) => {
      const latest = s.priceEntries[0];
      if (!latest || !s.servingsPerUnit) return null;
      return latest.priceCents / s.servingsPerUnit;
    })
    .filter((v): v is number => v !== null);
  const categoryAveragePricePerDoseInCents =
    perDose.length > 0
      ? Math.round(perDose.reduce((sum, v) => sum + v, 0) / perDose.length)
      : Math.round(PRICE.priceCents / attributes.servingsPerUnit);

  const container = buildInfrastructureContainer();
  await container.useCases.evaluateSupplement.execute({
    supplementId: product.id,
    facts: {
      composition: {
        activeIngredientAmountPerServing: attributes.caffeineMg,
        referenceRangePerServing: { min: 100, max: 300 }, // cafeína por dose — faixa usual de pré-treino
        additives: [],
        undisclosedSubstances: [],
      },
      pricing: {
        priceInCents: PRICE.priceCents,
        dosesPerUnit: attributes.servingsPerUnit,
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

  const ranking = await container.useCases.generateRanking.execute({ categorySlug: "pre-treino" });
  console.warn(`Ranking de pre-treino regenerado com ${ranking.entries.length} entradas.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
