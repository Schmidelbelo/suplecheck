import { prisma } from "../src/lib/db/prisma";
import { buildInfrastructureContainer } from "../packages/infrastructure/src/index";

/**
 * Captura de dados REAIS para 3 produtos de Whey Protein — script de
 * uma execução. Os outros 6 produtos criados como DRAFT em
 * `seedWheyProtein.ts` (Growth, Dux, Dark Lab, Black Skull, Probiótica,
 * Vitafor, BodyAction) permanecem em DRAFT — sem preço/loja/fonte
 * confirmados com segurança nesta sprint, apesar de tentativas reais de
 * pesquisa (várias lojas oficiais bloquearam acesso automatizado —
 * Cloudflare/verificação de navegador — ou tiveram DNS inacessível a
 * partir deste ambiente; Amazon/Netshoes bloquearam a extração de
 * conteúdo). Ver relatório da sprint para o detalhe de cada pendência —
 * nada foi inventado para preencher a lacuna.
 *
 * Os 3 produtos abaixo têm preço e URL confirmados em 2026-09-06 numa
 * página real, alcançável e lida diretamente (não apenas um resultado
 * de busca) — mas preço de suplemento muda com frequência; o valor
 * aqui é o vigente na data da captura, não uma garantia permanente.
 *
 * IMPORTANTE — por que este script grava preço/atributos/nota mas
 * MANTÉM `status: "DRAFT"`, ao contrário do padrão usado por
 * `seed.ts`/creatina: o smoke test desta sprint descobriu que só a
 * categoria `creatina` tem página de detalhe de produto de verdade
 * (`/creatina/[slug]`) — nenhuma rota existe para exibir um produto de
 * qualquer OUTRA categoria individualmente (`/categorias/[slug]`
 * mostra o ranking, mas "ver detalhes" de um item aponta para uma URL
 * que não existe). Publicar estes 3 produtos deixaria o ranking de
 * Whey Protein cheio de links que resultam em 404 — pior para o
 * usuário do que não publicar. Preço, nota, atributos nutricionais e
 * imagem estão todos gravados e prontos; falta só trocar `status` para
 * `PUBLISHED` e regenerar o ranking assim que a rota de detalhe de
 * produto for generalizada para outras categorias (ver relatório desta
 * sprint, "Próximos passos").
 */

interface PublishItem {
  slug: string;
  storeSlug: string;
  priceCents: number;
  url: string;
  /** g de proteína por dose — mesmo valor já usado no seed, revalidado nesta sprint contra a fonte. */
  proteinPerDoseGrams: number;
  servingsPerUnit: number;
  hasProprietaryBlend: boolean;
  nutritionalInfoComplete: boolean;
  /** Campos nutricionais confirmados na mesma captura — guardados em `attributes`, não usados pelo motor de score (que não modela carboidrato/gordura/sódio). `null` quando não confirmado nesta sprint. */
  carbsGrams: number | null;
  fatGrams: number | null;
  sodiumMg: number | null;
  ingredientsText: string;
  sourceUrl: string;
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
    hasProprietaryBlend: false,
    nutritionalInfoComplete: true,
    carbsGrams: null,
    fatGrams: null,
    sodiumMg: null,
    ingredientsText:
      "Proteína concentrada do soro do leite (WPC), aromatizante, emulsificante lecitina de soja e edulcorante sucralose.",
    sourceUrl: "https://www.maxtitanium.com.br/100-whey-pote-900g/p",
    capturedAt: "2026-09-06",
  },
  {
    slug: "integralmedica-whey-protein-concentrado-900g",
    storeSlug: "loja-oficial",
    priceCents: 24000,
    url: "https://www.integralmedica.com.br/whey-protein-concentrado-900g/p",
    proteinPerDoseGrams: 21,
    servingsPerUnit: 30,
    hasProprietaryBlend: false,
    nutritionalInfoComplete: true,
    carbsGrams: 5.1,
    fatGrams: 1.9,
    sodiumMg: 65,
    ingredientsText: "Proteína de soro do leite concentrada, aromatizante e edulcorante sucralose.",
    sourceUrl: "https://www.integralmedica.com.br/whey-protein-concentrado-900g/p",
    capturedAt: "2026-09-06",
  },
  {
    slug: "adaptogen-tasty-whey-3w-900g",
    storeSlug: "loja-oficial",
    priceCents: 30201,
    url: "https://adaptogen.com.br/proteinas/whey-protein-3w/",
    proteinPerDoseGrams: 24,
    servingsPerUnit: 26,
    hasProprietaryBlend: false, // Blend de 3 tipos de whey NOMEADOS (concentrado/isolado/hidrolisado) — não é "proprietary blend" no sentido de esconder proporção de um ingrediente não identificado.
    nutritionalInfoComplete: false, // Proteína/dose confirmada; carboidrato/gordura/sódio não confirmados nesta sprint (tabela nutricional não acessível via texto na captura).
    carbsGrams: null,
    fatGrams: null,
    sodiumMg: null,
    ingredientsText: "Blend de proteína concentrada, isolada e hidrolisada do soro do leite.",
    sourceUrl: "https://adaptogen.com.br/proteinas/whey-protein-3w/",
    capturedAt: "2026-09-06",
  },
];

const WHEY_PROTEIN_METHODOLOGY_ID = "whey-protein-methodology";

async function main() {
  const container = buildInfrastructureContainer();

  const averagePricePerDoseCents = Math.round(
    PUBLISH_ITEMS.reduce((sum, item) => sum + item.priceCents / item.servingsPerUnit, 0) /
      PUBLISH_ITEMS.length,
  );

  for (const item of PUBLISH_ITEMS) {
    const product = await prisma.product.findUniqueOrThrow({ where: { slug: item.slug } });
    const store = await prisma.store.findUniqueOrThrow({ where: { slug: item.storeSlug } });
    const sku = await prisma.sku.findFirstOrThrow({ where: { productId: product.id } });

    // Atualiza o SKU com a dosagem revalidada nesta sprint (mesmo valor do seed, conferido de novo contra a fonte).
    await prisma.sku.update({
      where: { id: sku.id },
      data: { dosagePerServing: item.proteinPerDoseGrams, servingsPerUnit: item.servingsPerUnit },
    });

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

    // Mesmo placeholder já usado pelas 10 creatinas (nenhuma foto real de produto
    // foi sourceada nesta sprint) — asset genérico existente, não uma foto inventada.
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

    await prisma.product.update({
      where: { id: product.id },
      data: {
        // NÃO "PUBLISHED" — ver cabeçalho do arquivo (rota de detalhe
        // de produto ainda não existe para categorias além de creatina).
        status: "DRAFT",
        attributes: {
          ...((product.attributes as Record<string, unknown> | null) ?? {}),
          proteinPerDoseGrams: item.proteinPerDoseGrams,
          carbsGrams: item.carbsGrams,
          fatGrams: item.fatGrams,
          sodiumMg: item.sodiumMg,
          ingredients: item.ingredientsText,
          sourceUrl: item.sourceUrl,
          dataCapturedAt: item.capturedAt,
        },
      },
    });

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
          hasProprietaryBlend: item.hasProprietaryBlend,
          nutritionalInfoComplete: item.nutritionalInfoComplete,
          dosageClearlyStated: true,
        },
        // reputation, marketingClaims e store OMITIDOS deliberadamente:
        // sem nota de avaliação de compradores nem lista de alegações de
        // marketing confirmadas com segurança nesta sprint — o motor já
        // trata ausência de fato como nota neutra + flag documentada
        // (ver ReputationCriterion/ExaggeratedClaimsCriterion), nunca
        // como erro. `store.trustScore` é o único fato de loja
        // reaproveitado, e é dado real já persistido (`Store.trustScore`
        // da "Loja Oficial da Marca"), não um valor novo inventado.
        ...(store.trustScore != null
          ? { store: { trustScore: store.trustScore, hasBuyerProtection: true } }
          : {}),
      },
    });

    console.warn(
      `Dados capturados + avaliado (DRAFT, não publicado): ${product.name} (${item.priceCents / 100} via ${item.url})`,
    );
  }

  await container.ports.methodologies.setActiveForCategory(
    "whey-protein",
    WHEY_PROTEIN_METHODOLOGY_ID,
    (await container.ports.methodologies.findById(WHEY_PROTEIN_METHODOLOGY_ID))!.version,
  );

  // Ranking NÃO gerado deliberadamente — ver cabeçalho do arquivo. Gerar
  // agora encheria /categorias/whey-protein de links "ver detalhes" que
  // resultam em 404. Rodar `generateRanking({ categorySlug: "whey-protein" })`
  // manualmente assim que a rota de detalhe de produto existir.
  console.warn(
    "Ranking de whey-protein NÃO gerado (produtos em DRAFT) — ver cabeçalho do arquivo.",
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
