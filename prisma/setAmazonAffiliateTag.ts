import { prisma } from "../src/lib/db/prisma";

/**
 * Sprint de Monetização — configura a tag oficial de afiliado Amazon
 * (suplescore-20) na Store "amazon-br", já marcada `isAffiliate: true`
 * mas sem `affiliateBaseUrl` definido (por isso nenhum link Amazon
 * carregava a tag até agora). Formato de querystring pura, conforme
 * `buildAffiliateUrl` espera para o modelo Amazon Associates.
 */
async function main() {
  const store = await prisma.store.update({
    where: { slug: "amazon-br" },
    data: { affiliateBaseUrl: "tag=suplescore-20" },
  });
  console.warn(`Store atualizada: ${store.slug} → affiliateBaseUrl="${store.affiliateBaseUrl}"`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
