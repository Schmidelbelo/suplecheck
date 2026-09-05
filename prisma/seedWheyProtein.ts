import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Seed da categoria Whey Protein — reutiliza 100% da arquitetura já
 * criada para Creatina (mesmo `Category`/`Brand`/`Product`/`Sku`, mesma
 * metodologia versionada via `createMethodology`/`setActiveForCategory`,
 * os MESMOS 6 critérios embutidos do Core Domain — nenhum critério novo
 * foi criado, porque nenhum deles é específico de creatina: todos leem
 * fatos genéricos por categoria (`Facts.ts`), ver `docs/SCORING.md`).
 *
 * A categoria `whey-protein` já existe desde o seed inicial
 * (`prisma/seed.ts` → `CATEGORIES`) — nunca teve produto. Este arquivo
 * só adiciona o que faltava: marcas novas, os produtos reais e a
 * metodologia própria da categoria.
 *
 * IMPORTANTE — por que os produtos aqui nascem em DRAFT, sem preço e
 * sem nota: os nomes e o teor de proteína por dose de cada produto
 * abaixo vêm de pesquisa real (site oficial da marca ou varejo,
 * fonte citada em `sourceUrl`) — nunca inventados. Preço, reputação
 * (nota média/nº de avaliações) e loja real de cada produto, porém,
 * mudam constantemente e não foram capturados com confiança nesta
 * sprint; publicar e avaliar sem esses fatos reais violaria a mesma
 * regra que este projeto já segue em toda parte (nunca estimar ou
 * inventar dado de produto). Publicar/avaliar fica para quando esses
 * fatos forem capturados — ver `CHANGELOG.md` (sprint de expansão da
 * categoria Whey Protein) e `OPERACAO_BETA.md` §5 (publicar produto).
 */

const NEW_BRANDS = [
  { slug: "dark-lab", name: "Dark Lab" },
  { slug: "adaptogen", name: "Adaptogen" },
  { slug: "bodyaction", name: "BodyAction" },
] as const;

interface WheyProteinSeedItem {
  slug: string;
  name: string;
  brandSlug: string;
  variantLabel: string;
  /** g por dose (tamanho do scoop/porção declarado no rótulo) — não confundir com proteína por dose. */
  servingSizeGrams: number;
  /** g de proteína por dose, conforme tabela nutricional oficial/varejo — nunca estimado. */
  proteinPerDoseGrams: number;
  servingsPerUnit: number;
  labelComplete: boolean;
  sourceUrl: string;
}

/**
 * 10 produtos reais, um por marca prioritária (Fase 4 da sprint), na
 * versão "concentrado" (WPC) padrão de cada marca quando existir mais
 * de uma linha — mesma lógica usada para escolher as 10 creatinas.
 * `proteinPerDoseGrams`/`servingSizeGrams` vêm da tabela nutricional
 * publicada pela própria marca ou por varejista oficial (`sourceUrl`).
 */
const WHEY_PROTEINS: WheyProteinSeedItem[] = [
  {
    slug: "growth-whey-protein-concentrado-900g",
    name: "Growth Whey Protein Concentrado 900g",
    brandSlug: "growth-supplements",
    variantLabel: "900g",
    servingSizeGrams: 30,
    proteinPerDoseGrams: 22,
    servingsPerUnit: 30,
    labelComplete: true,
    sourceUrl:
      "https://www.tabelatacoonline.com.br/tabela-nutricional/marcas/growth-suplementos-whey-protein-concentrado-sabor-leite-em-po",
  },
  {
    slug: "max-titanium-100-whey-protein-900g",
    name: "Max Titanium 100% Whey Protein Concentrado 900g",
    brandSlug: "max-titanium",
    variantLabel: "900g",
    servingSizeGrams: 30,
    proteinPerDoseGrams: 21,
    servingsPerUnit: 30,
    labelComplete: true,
    sourceUrl: "https://www.maxtitanium.com.br/100-whey-pote-900g/p",
  },
  {
    slug: "integralmedica-whey-protein-concentrado-900g",
    name: "Integralmédica Whey Protein Concentrado 100% Pure 900g",
    brandSlug: "integralmedica",
    variantLabel: "900g",
    servingSizeGrams: 30,
    proteinPerDoseGrams: 21,
    servingsPerUnit: 30,
    labelComplete: true,
    sourceUrl: "https://www.integralmedica.com.br/whey-protein-concentrado-900g/p",
  },
  {
    slug: "dux-whey-protein-concentrado-900g",
    name: "Dux Human Health Whey Protein Concentrado 900g",
    brandSlug: "dux-nutrition",
    variantLabel: "900g",
    servingSizeGrams: 30,
    proteinPerDoseGrams: 20,
    servingsPerUnit: 30,
    labelComplete: true,
    sourceUrl: "https://www.duxhumanhealth.com/proteinas/proteinas-puras/whey-protein-concentrado",
  },
  {
    slug: "dark-lab-100-whey-protein-900g",
    name: "Dark Lab 100% Whey Protein 900g",
    brandSlug: "dark-lab",
    variantLabel: "900g",
    servingSizeGrams: 30,
    proteinPerDoseGrams: 21,
    servingsPerUnit: 30,
    labelComplete: true,
    sourceUrl: "https://darklabsuplementos.com.br/products/whey-100-refil-900g-dark-lab-1",
  },
  {
    slug: "black-skull-whey-protein-concentrado-900g",
    name: "Black Skull Whey Protein Concentrado 80% HD 900g",
    brandSlug: "black-skull",
    variantLabel: "900g",
    servingSizeGrams: 30,
    proteinPerDoseGrams: 24,
    servingsPerUnit: 30,
    labelComplete: true,
    sourceUrl: "https://www.blackskullusa.com.br/whey-80-hd-caveira-preta-1/p",
  },
  {
    slug: "probiotica-100-pure-whey-900g",
    name: "Probiótica 100% Pure Whey 900g",
    brandSlug: "probiotica",
    variantLabel: "900g",
    servingSizeGrams: 30,
    proteinPerDoseGrams: 22,
    servingsPerUnit: 30,
    labelComplete: true,
    sourceUrl: "https://www.probiotica.com.br/100-pure-whey-pote-900g/p",
  },
  {
    slug: "adaptogen-tasty-whey-3w-900g",
    name: "Adaptogen Tasty Whey 3W 900g",
    brandSlug: "adaptogen",
    variantLabel: "900g",
    servingSizeGrams: 34,
    proteinPerDoseGrams: 24,
    servingsPerUnit: 26,
    labelComplete: true,
    sourceUrl: "https://adaptogen.com.br/proteinas/whey-protein-3w/",
  },
  {
    slug: "vitafor-whey-protein-concentrado-900g",
    name: "Vitafor Whey Protein Concentrado (WPC) 900g",
    brandSlug: "vitafor",
    variantLabel: "900g",
    servingSizeGrams: 30,
    proteinPerDoseGrams: 21,
    servingsPerUnit: 30,
    labelComplete: true,
    sourceUrl: "https://www.vitafor.com.br/whey-e-proteinas",
  },
  {
    slug: "bodyaction-body-whey-protein-900g",
    name: "BodyAction Body Whey Protein 900g",
    brandSlug: "bodyaction",
    variantLabel: "900g",
    servingSizeGrams: 40,
    proteinPerDoseGrams: 30,
    servingsPerUnit: 22,
    labelComplete: true,
    sourceUrl: "https://www.bodyaction.com.br/linha-completa/body-whey-900g",
  },
];

const WHEY_PROTEIN_METHODOLOGY_ID = "whey-protein-methodology";

/**
 * Faixa de referência (g de proteína por dose de ~30g) usada pelo
 * `CostBenefitCriterion` para julgar "adequação de dosagem" — o mesmo
 * papel que `{ min: 3000, max: 5000 }` (mg) cumpre para creatina.
 * Baseada nos próprios produtos pesquisados nesta sprint (20g–30g por
 * dose, ver `sourceUrl` de cada item acima): produtos abaixo de ~18g
 * por dose de 30g (< 60% de proteína) não seriam comercializados como
 * "whey protein concentrado" pelo mercado brasileiro pesquisado; o teto
 * de 30g reflete o produto mais concentrado encontrado na pesquisa
 * (BodyAction, dose maior com blend WPC+WPI+WPH). Ajustar esta faixa é
 * uma decisão editorial de metodologia — documentar em `docs/SCORING.md`
 * se revisada.
 */
const PROTEIN_REFERENCE_RANGE = { min: 18, max: 30 };

async function seedBrands() {
  for (const brand of NEW_BRANDS) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      create: brand,
      update: { name: brand.name },
    });
  }
  console.warn(
    `Seed whey-protein: ${NEW_BRANDS.length} marcas novas (Dark Lab, Adaptogen, BodyAction).`,
  );
}

async function seedProducts(): Promise<string[]> {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: "whey-protein" } });
  const productIds: string[] = [];

  for (const item of WHEY_PROTEINS) {
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
          sourceUrl: item.sourceUrl,
        },
      },
      update: {},
    });
    productIds.push(product.id);

    // Sem GTIN real capturado ainda — `gtin` fica `null` (campo opcional)
    // em vez de qualquer valor inventado; usa productId+variantLabel para
    // a idempotência do seed em vez do upsert por `gtin` que os outros
    // itens do catálogo usam quando o código de barras é conhecido.
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
    // Sem PriceEntry, sem ProductImage de capa: nenhum preço real capturado ainda
    // (ver cabeçalho do arquivo) — não inventar. Adicionar quando houver captura real.
  }
  console.warn(
    `Seed whey-protein: ${WHEY_PROTEINS.length} produtos reais criados como DRAFT (sem preço/nota ainda).`,
  );
  return productIds;
}

async function seedMethodology() {
  const container = buildInfrastructureContainer();

  const methodology =
    (await container.ports.methodologies.findById(WHEY_PROTEIN_METHODOLOGY_ID)) ??
    (await container.useCases.createMethodology.execute({
      id: WHEY_PROTEIN_METHODOLOGY_ID,
      name: "Metodologia de Avaliação de Whey Protein",
      // Mesmos 6 critérios embutidos e MESMOS pesos da metodologia de
      // creatina (nunca inventados agora) — a filosofia da SupleScore
      // (custo-benefício e transparência de rótulo pesam mais que
      // reputação/loja, que por sua vez pesam mais que promessas de
      // marketing) é a mesma independente da categoria; o que muda por
      // categoria são os FATOS (faixa de referência de proteína em vez
      // de mg de creatina), nunca os critérios nem os pesos.
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
    "whey-protein",
    methodology.id,
    methodology.version,
  );
  console.warn(
    `Seed whey-protein: metodologia "${methodology.id}" v${methodology.version} ativa para "whey-protein".`,
  );
}

async function main() {
  await seedBrands();
  await seedProducts();
  await seedMethodology();
  console.warn(
    "Seed whey-protein concluído. Produtos em DRAFT, sem preço/avaliação — publicar via API administrativa (ver OPERACAO_BETA.md) assim que preço real + loja real forem capturados.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { PROTEIN_REFERENCE_RANGE, WHEY_PROTEIN_METHODOLOGY_ID };
