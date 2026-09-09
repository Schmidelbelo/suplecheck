import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Sprint de Publicação — Growth Supplements (Whey Protein).
 *
 * O site oficial (growthsupplements.com.br → gsuplementos.com.br) está
 * protegido por um desafio anti-bot Cloudflare ("Verifying your
 * browser...") em toda tentativa de acesso automatizado — confirmado
 * de novo nesta sprint, mesmo bloqueio já documentado em 3 sprints
 * anteriores. Autorizado pelo usuário a usar dado de revendedor:
 *
 * - Ficha nutricional (proteína por porção, tamanho da porção): o registro
 *   DRAFT já existente (sprint anterior) citava 22g/30g de uma fonte
 *   agregadora de terceiros (tabelatacoonline.com.br) — divergência real
 *   encontrada nesta sprint contra mkpbr.com, que cita 23g/30g (sabor
 *   aromatizado) ou 24g/30g (sabor Natural). Decisão explícita do
 *   usuário: priorizar mkpbr.com (revendedor direto da marca, catálogo
 *   completo com os 19 sabores/fórmula) sobre o agregador de tabelas —
 *   valor usado: 23g/30g, extraído literalmente, sem cálculo/estimativa.
 * - Preço e URL da oferta real: Amazon.com.br, mesma linha de produto
 *   ("100% Whey Concentrado", 900g, Chocolate) — loja já cadastrada
 *   como afiliada no catálogo (`amazon-br`).
 *
 * Atualiza o produto DRAFT já existente (`growth-whey-protein-concentrado-900g`)
 * em vez de criar um novo — evita duplicar o catálogo.
 */

const PRODUCT = {
  slug: "growth-whey-protein-concentrado-900g",
  name: "Growth Whey Protein Concentrado 900g",
  variantLabel: "900g",
  proteinPerDoseGrams: 23, // sabor aromatizado (Chocolate) — mkpbr.com cita 24g só para o sabor "Natural"
  servingSizeGrams: 30,
  servingsPerUnit: 30, // 900g / 30g = 30 doses
  ingredientsText: "Concentrado proteico do soro do leite (WPC), lecitina de soja (emulsificante).",
  sourceUrl: "https://mkpbr.com/en-us/products/growth-supplements-concentrated-whey-protein",
} as const;

const PRICE = {
  storeSlug: "amazon-br",
  priceCents: 19490, // R$ 194,90 — preço exibido na página da Amazon no momento da captura
  url: "https://www.amazon.com.br/Whey-Protein-Concentrado-Growth-Supplements/dp/B0H8LTG86T",
  capturedAt: "2026-09-09",
} as const;

const WHEY_PROTEIN_METHODOLOGY_ID = "whey-protein-methodology";

async function createProductAndSku() {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: "whey-protein" } });
  const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: "growth-supplements" } });

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
    // Produto já existia em DRAFT com dado de fonte divergente (22g/30g,
    // tabelatacoonline.com.br) — atualiza para a fonte priorizada nesta
    // sprint (23g/30g, mkpbr.com), nunca mescla/estima os dois valores.
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
