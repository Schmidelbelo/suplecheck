import { prisma } from "../src/lib/db/prisma";

/**
 * Ativação segura de afiliado — script administrativo único-uso,
 * mesmo padrão já usado em `prisma/setAmazonAffiliateTag.ts`. Recebe a
 * loja e o link/tag reais via env var (nunca hardcoded, nunca
 * inventado aqui): quem roda o script já tem o link de verdade em
 * mãos, vindo do painel do programa de afiliados contratado.
 *
 * Uso:
 *   STORE_SLUG=netshoes AFFILIATE_BASE_URL="https://参..." npx tsx prisma/configureStoreAffiliate.ts
 *
 * `AFFILIATE_BASE_URL` aceita os dois formatos que `buildAffiliateUrl`
 * já reconhece (ver `src/modules/monetization/lib/affiliateUrl.ts`):
 * - querystring pura, ex.: `tag=suplescore-20` (padrão Amazon Associates)
 * - wrapper com `{url}`, ex.: `https://rede.example/click?url={url}` (Awin/Lomadee/Rakuten...)
 *
 * Nunca toca em nenhuma outra loja — só a apontada por `STORE_SLUG`.
 * Nunca ativa `isAffiliate` sem um `AFFILIATE_BASE_URL` real informado.
 */

function assertNonEmpty(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    console.error(`\nFaltando a variável de ambiente ${name}.`);
    console.error(
      `Uso: STORE_SLUG=<slug> AFFILIATE_BASE_URL=<link ou querystring real> npx tsx prisma/configureStoreAffiliate.ts`,
    );
    process.exit(1);
  }
  return value.trim();
}

async function main() {
  const storeSlug = assertNonEmpty("STORE_SLUG", process.env.STORE_SLUG);
  const affiliateBaseUrl = assertNonEmpty("AFFILIATE_BASE_URL", process.env.AFFILIATE_BASE_URL);

  const before = await prisma.store.findUnique({ where: { slug: storeSlug } });
  if (!before) {
    console.error(`\nLoja "${storeSlug}" não encontrada — nenhuma alteração feita.`);
    process.exit(1);
  }

  console.warn("=== ANTES ===");
  console.warn({
    slug: before.slug,
    name: before.name,
    isAffiliate: before.isAffiliate,
    affiliateBaseUrl: before.affiliateBaseUrl,
  });

  const after = await prisma.store.update({
    where: { slug: storeSlug },
    data: { isAffiliate: true, affiliateBaseUrl },
  });

  console.warn("\n=== DEPOIS ===");
  console.warn({
    slug: after.slug,
    name: after.name,
    isAffiliate: after.isAffiliate,
    affiliateBaseUrl: after.affiliateBaseUrl,
  });
  console.warn(
    `\nLoja "${after.name}" ativada. Todo clique novo em "Ver oferta" pra produtos desta loja já sai monetizado — nenhuma outra loja foi alterada.`,
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
