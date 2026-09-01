import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Seed inicial da plataforma — Categorias/Marcas/Fabricantes mínimos
 * (módulo Catálogo) + as 10 creatinas do MVP, avaliadas pelo Índice
 * SupleCheck de verdade (Core Domain via `EvaluateSupplementUseCase`) e
 * com um Ranking gerado ao final — é isto que a página pública `/creatina`
 * consome. Idempotente: `upsert` por slug/gtin, e reavaliação/ranking só
 * rodam se ainda não existirem, então `prisma db seed` pode rodar várias
 * vezes sem duplicar nada nem inflar o histórico de notas a cada run.
 */

const CATEGORIES = [
  {
    slug: "creatina",
    name: "Creatina",
    description: "Suplementos de creatina em suas variações (monohidratada, HCL, etc.)",
  },
  {
    slug: "whey-protein",
    name: "Whey Protein",
    description: "Proteínas do soro do leite (concentrado, isolado, hidrolisado)",
  },
  {
    slug: "pre-treino",
    name: "Pré-treino",
    description: "Fórmulas estimulantes e não-estimulantes para performance no treino",
  },
  {
    slug: "multivitaminicos",
    name: "Multivitamínicos",
    description: "Combinações de vitaminas e minerais",
  },
  { slug: "omega-3", name: "Ômega 3", description: "Ácidos graxos essenciais (EPA/DHA)" },
] as const;

const BRANDS = [
  { slug: "growth-supplements", name: "Growth Supplements" },
  { slug: "max-titanium", name: "Max Titanium" },
  { slug: "integralmedica", name: "Integralmédica" },
  { slug: "black-skull", name: "Black Skull" },
  { slug: "dux-nutrition", name: "Dux Nutrition" },
  { slug: "atlhetica-nutrition", name: "Atlhetica Nutrition" },
  { slug: "probiotica", name: "Probiótica" },
  { slug: "vitafor", name: "Vitafor" },
  { slug: "nutrata", name: "Nutrata" },
  { slug: "optimum-nutrition", name: "Optimum Nutrition" },
] as const;

const MANUFACTURERS = [
  {
    slug: "growth-industria",
    name: "Growth Indústria e Comércio Ltda",
    country: "Brasil",
    certifications: ["ANVISA"],
  },
  {
    slug: "integralmedica-industria",
    name: "Integralmédica Indústria Ltda",
    country: "Brasil",
    certifications: ["ANVISA", "ISO 22000"],
  },
  {
    slug: "dux-industria",
    name: "Dux Nutrition Lab Indústria Ltda",
    country: "Brasil",
    certifications: ["ANVISA"],
  },
] as const;

const STORES = [
  { slug: "loja-oficial", name: "Loja Oficial da Marca", trustScore: 88, isAffiliate: false },
  { slug: "amazon-br", name: "Amazon", trustScore: 92, isAffiliate: true },
  { slug: "netshoes", name: "Netshoes", trustScore: 78, isAffiliate: true },
] as const;

const PLACEHOLDER_IMAGE = "/images/products/creatina-placeholder.svg";

interface CreatinaSeed {
  readonly slug: string;
  readonly name: string;
  readonly brandSlug: string;
  readonly manufacturerSlug?: string;
  readonly gtin: string;
  readonly variantLabel: string;
  readonly servingsPerUnit: number;
  readonly dosagePerServing: number;
  readonly storeSlug: string;
  readonly priceCents: number;
  /**
   * Link real e funcional (busca no varejista), não uma URL fictícia —
   * ainda não é um link de afiliado (nenhum programa de afiliados foi
   * contratado até esta etapa). `Store.affiliateBaseUrl`/`isAffiliate`
   * (schema) já existem para quando isso mudar: trocar este campo por
   * um link de afiliado real não exige nenhuma alteração de schema ou
   * de código, só um novo valor aqui.
   */
  readonly url: string;
  /** 0–1: o quanto o rótulo entrega da dose declarada — alimenta `composition.activeIngredientAmountPerServing`. */
  readonly doseCompliance: number;
  readonly labelComplete: boolean;
  readonly averageRating: number;
  readonly reviewCount: number;
  readonly scientificClaimsRatio: number;
}

const CREATINAS: readonly CreatinaSeed[] = [
  {
    slug: "growth-creatina-monohidratada-300g",
    name: "Creatina Monohidratada 300g",
    brandSlug: "growth-supplements",
    manufacturerSlug: "growth-industria",
    gtin: "7896001001001",
    variantLabel: "300g",
    servingsPerUnit: 60,
    dosagePerServing: 5,
    storeSlug: "amazon-br",
    priceCents: 4990,
    url: "https://www.amazon.com.br/s?k=Growth+Supplements+Creatina+Monohidratada+300g",
    doseCompliance: 0.98,
    labelComplete: true,
    averageRating: 4.6,
    reviewCount: 1850,
    scientificClaimsRatio: 1,
  },
  {
    slug: "max-titanium-creatina-300g",
    name: "Creatina 300g",
    brandSlug: "max-titanium",
    manufacturerSlug: "growth-industria",
    gtin: "7896001001002",
    variantLabel: "300g",
    servingsPerUnit: 60,
    dosagePerServing: 5,
    storeSlug: "amazon-br",
    priceCents: 5490,
    url: "https://www.amazon.com.br/s?k=Max+Titanium+Creatina+300g",
    doseCompliance: 0.95,
    labelComplete: true,
    averageRating: 4.4,
    reviewCount: 1200,
    scientificClaimsRatio: 0.8,
  },
  {
    slug: "integralmedica-creatina-creapure-300g",
    name: "Creatina Creapure 300g",
    brandSlug: "integralmedica",
    manufacturerSlug: "integralmedica-industria",
    gtin: "7896001001003",
    variantLabel: "300g",
    servingsPerUnit: 60,
    dosagePerServing: 5,
    storeSlug: "loja-oficial",
    priceCents: 7990,
    url: "https://www.amazon.com.br/s?k=Integralm%C3%A9dica+Creatina+Creapure+300g",
    doseCompliance: 1,
    labelComplete: true,
    averageRating: 4.8,
    reviewCount: 2400,
    scientificClaimsRatio: 1,
  },
  {
    slug: "black-skull-creatina-300g",
    name: "Creatina Black Skull 300g",
    brandSlug: "black-skull",
    manufacturerSlug: "growth-industria",
    gtin: "7896001001004",
    variantLabel: "300g",
    servingsPerUnit: 60,
    dosagePerServing: 5,
    storeSlug: "amazon-br",
    priceCents: 5990,
    url: "https://www.amazon.com.br/s?k=Black+Skull+Creatina+300g",
    doseCompliance: 0.92,
    labelComplete: true,
    averageRating: 4.3,
    reviewCount: 900,
    scientificClaimsRatio: 0.7,
  },
  {
    slug: "dux-creatina-300g",
    name: "Creatina Dux 300g",
    brandSlug: "dux-nutrition",
    manufacturerSlug: "dux-industria",
    gtin: "7896001001005",
    variantLabel: "300g",
    servingsPerUnit: 60,
    dosagePerServing: 5,
    storeSlug: "loja-oficial",
    priceCents: 6490,
    url: "https://www.amazon.com.br/s?k=Dux+Nutrition+Creatina+300g",
    doseCompliance: 0.97,
    labelComplete: true,
    averageRating: 4.7,
    reviewCount: 1500,
    scientificClaimsRatio: 1,
  },
  {
    slug: "atlhetica-creatina-300g",
    name: "Creatina Nitro 300g",
    brandSlug: "atlhetica-nutrition",
    manufacturerSlug: "growth-industria",
    gtin: "7896001001006",
    variantLabel: "300g",
    servingsPerUnit: 60,
    dosagePerServing: 5,
    storeSlug: "amazon-br",
    priceCents: 4790,
    url: "https://www.amazon.com.br/s?k=Atlhetica+Nutrition+Creatina+Nitro+300g",
    doseCompliance: 0.9,
    labelComplete: true,
    averageRating: 4.2,
    reviewCount: 650,
    scientificClaimsRatio: 0.7,
  },
  {
    slug: "probiotica-creatina-300g",
    name: "Creatina Probiótica 300g",
    brandSlug: "probiotica",
    manufacturerSlug: "integralmedica-industria",
    gtin: "7896001001007",
    variantLabel: "300g",
    servingsPerUnit: 60,
    dosagePerServing: 5,
    storeSlug: "netshoes",
    priceCents: 4490,
    url: "https://www.amazon.com.br/s?k=Probi%C3%B3tica+Creatina+300g",
    doseCompliance: 0.8,
    labelComplete: false,
    averageRating: 3.8,
    reviewCount: 320,
    scientificClaimsRatio: 0.4,
  },
  {
    slug: "vitafor-creatina-300g",
    name: "Creatina Vitafor 300g",
    brandSlug: "vitafor",
    manufacturerSlug: "dux-industria",
    gtin: "7896001001008",
    variantLabel: "300g",
    servingsPerUnit: 60,
    dosagePerServing: 5,
    storeSlug: "loja-oficial",
    priceCents: 8990,
    url: "https://www.amazon.com.br/s?k=Vitafor+Creatina+300g",
    doseCompliance: 0.99,
    labelComplete: true,
    averageRating: 4.75,
    reviewCount: 1100,
    scientificClaimsRatio: 1,
  },
  {
    slug: "nutrata-creatina-creapure-250g",
    name: "Creatina Creapure 250g",
    brandSlug: "nutrata",
    manufacturerSlug: "growth-industria",
    gtin: "7896001001009",
    variantLabel: "250g",
    servingsPerUnit: 50,
    dosagePerServing: 5,
    storeSlug: "amazon-br",
    priceCents: 6990,
    url: "https://www.amazon.com.br/s?k=Nutrata+Creatina+Creapure+250g",
    doseCompliance: 1,
    labelComplete: true,
    averageRating: 4.65,
    reviewCount: 480,
    scientificClaimsRatio: 1,
  },
  {
    slug: "optimum-nutrition-creatine-300g",
    name: "Micronized Creatine Powder 300g",
    brandSlug: "optimum-nutrition",
    gtin: "7896001001010",
    variantLabel: "300g",
    servingsPerUnit: 60,
    dosagePerServing: 5,
    storeSlug: "amazon-br",
    priceCents: 12990,
    url: "https://www.amazon.com.br/s?k=Optimum+Nutrition+Micronized+Creatine+Powder+300g",
    doseCompliance: 1,
    labelComplete: true,
    averageRating: 4.85,
    reviewCount: 3200,
    scientificClaimsRatio: 1,
  },
];

const CREATINA_METHODOLOGY_ID = "creatina-methodology";

async function seedReferenceData() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: category,
      update: { name: category.name, description: category.description },
    });
  }
  console.warn(`Seed: ${CATEGORIES.length} categorias.`);

  for (const brand of BRANDS) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      create: brand,
      update: { name: brand.name },
    });
  }
  console.warn(`Seed: ${BRANDS.length} marcas.`);

  for (const manufacturer of MANUFACTURERS) {
    await prisma.manufacturer.upsert({
      where: { slug: manufacturer.slug },
      create: manufacturer,
      update: {
        name: manufacturer.name,
        country: manufacturer.country,
        certifications: manufacturer.certifications,
      },
    });
  }
  console.warn(`Seed: ${MANUFACTURERS.length} fabricantes.`);

  for (const store of STORES) {
    await prisma.store.upsert({
      where: { slug: store.slug },
      create: store,
      update: { name: store.name, trustScore: store.trustScore, isAffiliate: store.isAffiliate },
    });
  }
  console.warn(`Seed: ${STORES.length} lojas.`);
}

async function seedCreatinas(): Promise<string[]> {
  const productIds: string[] = [];

  for (const item of CREATINAS) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      create: {
        slug: item.slug,
        name: item.name,
        categoryId: (await prisma.category.findUniqueOrThrow({ where: { slug: "creatina" } })).id,
        brandId: (await prisma.brand.findUniqueOrThrow({ where: { slug: item.brandSlug } })).id,
        manufacturerId: item.manufacturerSlug
          ? (
              await prisma.manufacturer.findUniqueOrThrow({
                where: { slug: item.manufacturerSlug },
              })
            ).id
          : undefined,
        status: "PUBLISHED",
      },
      update: { status: "PUBLISHED" },
    });
    productIds.push(product.id);

    const sku = await prisma.sku.upsert({
      where: { gtin: item.gtin },
      create: {
        productId: product.id,
        gtin: item.gtin,
        variantLabel: item.variantLabel,
        servingsPerUnit: item.servingsPerUnit,
        dosagePerServing: item.dosagePerServing,
      },
      update: {},
    });

    const store = await prisma.store.findUniqueOrThrow({ where: { slug: item.storeSlug } });
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
        data: { productId: product.id, url: PLACEHOLDER_IMAGE, altText: item.name, role: "COVER" },
      });
    }
  }
  console.warn(`Seed: ${CREATINAS.length} creatinas (produto + SKU + preço + imagem).`);
  return productIds;
}

async function seedMethodologyAndScores() {
  const container = buildInfrastructureContainer();

  const methodology =
    (await container.ports.methodologies.findById(CREATINA_METHODOLOGY_ID)) ??
    (await container.useCases.createMethodology.execute({
      id: CREATINA_METHODOLOGY_ID,
      name: "Metodologia de Avaliação de Creatinas",
      criteria: [
        { criterionId: "cost-benefit", weight: 0.25 },
        { criterionId: "price-per-dose", weight: 0.15 },
        { criterionId: "label-transparency", weight: 0.25 },
        { criterionId: "reputation", weight: 0.15 },
        { criterionId: "exaggerated-claims", weight: 0.1 },
        { criterionId: "store-reliability", weight: 0.1 },
      ],
    }));

  await container.ports.methodologies.setActiveForCategory(
    "creatina",
    methodology.id,
    methodology.version,
  );
  console.warn(
    `Seed: metodologia "${methodology.id}" v${methodology.version} ativa para "creatina".`,
  );

  const averagePricePerDoseCents = Math.round(
    CREATINAS.reduce((sum, item) => sum + item.priceCents / item.servingsPerUnit, 0) /
      CREATINAS.length,
  );

  let evaluated = 0;
  for (const item of CREATINAS) {
    const product = await prisma.product.findUniqueOrThrow({ where: { slug: item.slug } });
    const alreadyScored = await container.ports.indexResults.findLatest(product.id);
    if (alreadyScored) continue;

    const activeIngredientAmountPerServing = item.doseCompliance * item.dosagePerServing * 1000; // g -> mg
    const scientificallySupportedClaims =
      item.scientificClaimsRatio >= 1
        ? ["aumenta força", "aumenta massa magra"]
        : ["aumenta força"];

    await container.useCases.evaluateSupplement.execute({
      supplementId: product.id,
      facts: {
        composition: {
          activeIngredientAmountPerServing,
          referenceRangePerServing: { min: 3000, max: 5000 },
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
          nutritionalInfoComplete: item.labelComplete,
          dosageClearlyStated: item.labelComplete,
        },
        reputation: { averageRating: item.averageRating, reviewCount: item.reviewCount },
        marketingClaims: {
          claims: ["aumenta força", "aumenta massa magra"],
          scientificallySupportedClaims,
        },
        store: { trustScore: 85, hasBuyerProtection: true },
      },
    });
    evaluated++;
  }
  console.warn(
    `Seed: ${evaluated} creatinas avaliadas pelo Índice SupleCheck (${CREATINAS.length - evaluated} já tinham nota).`,
  );

  const existingRanking = await container.ports.rankings.findLatest("creatina");
  if (!existingRanking) {
    const ranking = await container.useCases.generateRanking.execute({ categorySlug: "creatina" });
    console.warn(`Seed: ranking de "creatina" gerado com ${ranking.entries.length} entradas.`);
  } else {
    console.warn(
      'Seed: ranking de "creatina" já existia — não regerado (use POST /api/evaluation/rankings/creatina para atualizar).',
    );
  }

  await container.prisma.disconnect();
}

async function main() {
  await seedReferenceData();
  await seedCreatinas();
  await seedMethodologyAndScores();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
