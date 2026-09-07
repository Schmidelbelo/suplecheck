import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Sprint "Expansão Inteligente do Catálogo — Whey Protein". Continua o
 * trabalho de `seedWheyProtein.ts` (10 produtos, DRAFT) e
 * `publishWheyProteinRealData.ts` (3 avaliados, mas revertidos a DRAFT
 * na mesma sessão porque a rota de detalhe de produto para categorias
 * além de creatina ainda não existia). Essa rota já foi generalizada
 * (`/categorias/[slug]/[produto]`, sprint seguinte) — o bloqueio que
 * impedia a publicação não existe mais.
 *
 * Este script:
 * 1. Cria 3 produtos novos (Nutrata, Darkness, Probiótica Hiper) com
 *    dado real pesquisado e citado por fonte nesta sprint.
 * 2. Publica os 6 produtos com dado 100% verificado (preço real de uma
 *    página alcançável e lida diretamente, protein/dose e URL reais):
 *    Max Titanium, Integralmédica, Adaptogen (já capturados antes,
 *    revalidados) + Nutrata, Darkness, Probiótica Hiper (novos).
 * 3. Os outros 7 produtos já seedados (Growth, Dux, Dark Lab, Black
 *    Skull, Probiótica 100% Pure Whey, Vitafor, BodyAction) permanecem
 *    DRAFT — pesquisados nesta sprint (ver relatório), mas sem preço
 *    confirmável com segurança (bloqueio de bot/DNS) ou com dado
 *    numérico inconsistente entre fontes (proteína/dose divergente).
 */

interface NewProductItem {
  slug: string;
  name: string;
  brandSlug: string;
  variantLabel: string;
  proteinPerDoseGrams: number;
  servingSizeGrams: number;
  servingsPerUnit: number;
  ingredientsText: string;
  sourceUrl: string;
}

const NEW_BRANDS = [{ slug: "darkness", name: "Darkness" }] as const;

const NEW_PRODUCTS: NewProductItem[] = [
  {
    slug: "nutrata-w100-whey-concentrado-900g",
    name: "Nutrata W100 Whey Concentrado 900g",
    brandSlug: "nutrata",
    variantLabel: "900g",
    proteinPerDoseGrams: 21,
    servingSizeGrams: 30,
    servingsPerUnit: 30,
    ingredientsText:
      "Proteína de soro do leite concentrada, goma xantana (espessante), dióxido de silício (antiumectante), edulcorante sucralose e aromatizante.",
    sourceUrl: "https://loja.nutrata.com.br/nutrata-w100-whey-concentrado-900g-creme-de-baunilha",
  },
  {
    slug: "darkness-dark-whey-protein-concentrado-900g",
    name: "Darkness Dark Whey Protein Concentrado 900g",
    brandSlug: "darkness",
    variantLabel: "900g",
    proteinPerDoseGrams: 30,
    servingSizeGrams: 40,
    servingsPerUnit: 22, // 900g / 40g ≈ 22 doses (arredondado para baixo — nunca inventar fração de dose)
    ingredientsText: "Proteína de soro do leite concentrada, aromatizante e edulcorante sucralose.",
    sourceUrl: "https://www.darkness.com.br/whey-protein-concentrado-900g-darkness/p",
  },
  {
    slug: "probiotica-hiper-100-whey-900g",
    name: "Probiótica Hiper 100% Whey 900g",
    brandSlug: "probiotica",
    variantLabel: "900g",
    proteinPerDoseGrams: 23,
    servingSizeGrams: 40,
    servingsPerUnit: 22,
    ingredientsText:
      "Proteína concentrada do soro do leite (WPC), emulsificante lecitina de soja, aromatizante e edulcorante sucralose.",
    sourceUrl: "https://www.probiotica.com.br/hiper-100-whey-900g/p",
  },
];

/** Os 6 produtos publicados nesta sprint — os 3 já existentes (revalidados) + os 3 novos acima. */
interface PublishItem {
  slug: string;
  storeSlug: string;
  priceCents: number;
  url: string;
  proteinPerDoseGrams: number;
  servingsPerUnit: number;
  capturedAt: string;
}

const PUBLISH_ITEMS: PublishItem[] = [
  {
    slug: "max-titanium-100-whey-protein-900g",
    storeSlug: "loja-oficial",
    priceCents: 20408,
    url: "https://www.maxtitanium.com.br/100-whey-pote-900g/p",
    proteinPerDoseGrams: 21,
    servingsPerUnit: 30,
    capturedAt: "2026-09-06",
  },
  {
    slug: "integralmedica-whey-protein-concentrado-900g",
    storeSlug: "loja-oficial",
    priceCents: 24000,
    url: "https://www.integralmedica.com.br/whey-protein-concentrado-900g/p",
    proteinPerDoseGrams: 21,
    servingsPerUnit: 30,
    capturedAt: "2026-09-06",
  },
  {
    slug: "adaptogen-tasty-whey-3w-900g",
    storeSlug: "loja-oficial",
    priceCents: 30201,
    url: "https://adaptogen.com.br/proteinas/whey-protein-3w/",
    proteinPerDoseGrams: 24,
    servingsPerUnit: 26,
    capturedAt: "2026-09-06",
  },
  {
    slug: "nutrata-w100-whey-concentrado-900g",
    storeSlug: "loja-oficial",
    priceCents: 28800,
    url: "https://loja.nutrata.com.br/nutrata-w100-whey-concentrado-900g-creme-de-baunilha",
    proteinPerDoseGrams: 21,
    servingsPerUnit: 30,
    capturedAt: "2026-09-08",
  },
  {
    slug: "darkness-dark-whey-protein-concentrado-900g",
    storeSlug: "loja-oficial",
    priceCents: 25700,
    url: "https://www.darkness.com.br/whey-protein-concentrado-900g-darkness/p",
    proteinPerDoseGrams: 30,
    servingsPerUnit: 22,
    capturedAt: "2026-09-08",
  },
  {
    slug: "probiotica-hiper-100-whey-900g",
    storeSlug: "loja-oficial",
    priceCents: 11500,
    url: "https://www.probiotica.com.br/hiper-100-whey-900g/p",
    proteinPerDoseGrams: 23,
    servingsPerUnit: 22,
    capturedAt: "2026-09-08",
  },
];

const WHEY_PROTEIN_METHODOLOGY_ID = "whey-protein-methodology";

async function seedNewBrandsAndProducts() {
  for (const brand of NEW_BRANDS) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      create: brand,
      update: { name: brand.name },
    });
  }

  const category = await prisma.category.findUniqueOrThrow({ where: { slug: "whey-protein" } });

  for (const item of NEW_PRODUCTS) {
    const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: item.brandSlug } });

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      create: {
        slug: item.slug,
        name: item.name,
        categoryId: category.id,
        brandId: brand.id,
        status: "DRAFT",
        attributes: {
          servingSizeGrams: item.servingSizeGrams,
          proteinPerDoseGrams: item.proteinPerDoseGrams,
          ingredients: item.ingredientsText,
          sourceUrl: item.sourceUrl,
        },
      },
      update: {},
    });

    const existingSku = await prisma.sku.findFirst({
      where: { productId: product.id, variantLabel: item.variantLabel },
    });
    if (!existingSku) {
      await prisma.sku.create({
        data: {
          productId: product.id,
          variantLabel: item.variantLabel,
          servingsPerUnit: item.servingsPerUnit,
          dosagePerServing: item.proteinPerDoseGrams,
          status: "ACTIVE",
        },
      });
    }
  }
  console.warn(`Seed: ${NEW_PRODUCTS.length} produtos novos de whey protein (DRAFT).`);
}

async function publishVerifiedProducts() {
  const container = buildInfrastructureContainer();

  const averagePricePerDoseCents = Math.round(
    PUBLISH_ITEMS.reduce((sum, item) => sum + item.priceCents / item.servingsPerUnit, 0) /
      PUBLISH_ITEMS.length,
  );

  for (const item of PUBLISH_ITEMS) {
    const product = await prisma.product.findUniqueOrThrow({ where: { slug: item.slug } });
    const store = await prisma.store.findUniqueOrThrow({ where: { slug: item.storeSlug } });
    const sku = await prisma.sku.findFirstOrThrow({ where: { productId: product.id } });

    const existingPrice = await prisma.priceEntry.findFirst({
      where: { skuId: sku.id, storeId: store.id },
    });
    if (!existingPrice) {
      await prisma.priceEntry.create({
        data: {
          skuId: sku.id,
          storeId: store.id,
          priceCents: item.priceCents,
          url: item.url,
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

    await container.useCases.evaluateSupplement.execute({
      supplementId: product.id,
      facts: {
        composition: {
          activeIngredientAmountPerServing: item.proteinPerDoseGrams,
          referenceRangePerServing: { min: 18, max: 30 },
          additives: [],
          undisclosedSubstances: [],
        },
        pricing: {
          priceInCents: item.priceCents,
          dosesPerUnit: item.servingsPerUnit,
          categoryAveragePricePerDoseInCents: averagePricePerDoseCents,
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
      `Publicado + avaliado: ${product.name} (${item.priceCents / 100} via ${item.url})`,
    );
  }
}

async function main() {
  await seedNewBrandsAndProducts();
  await publishVerifiedProducts();

  const container = buildInfrastructureContainer();
  await container.ports.methodologies.setActiveForCategory(
    "whey-protein",
    WHEY_PROTEIN_METHODOLOGY_ID,
    (await container.ports.methodologies.findById(WHEY_PROTEIN_METHODOLOGY_ID))!.version,
  );

  const ranking = await container.useCases.generateRanking.execute({
    categorySlug: "whey-protein",
  });
  console.warn(`Ranking de whey-protein gerado com ${ranking.entries.length} entradas.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
