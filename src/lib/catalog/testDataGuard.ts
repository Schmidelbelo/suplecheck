/**
 * Barreira de proteção contra dados de teste vazados no banco real
 * aparecendo em superfície pública (listagem, sitemap, API de catálogo,
 * página de categoria). Não é uma solução definitiva — a limpeza real
 * desses registros é feita em outra sprint, separada desta proteção.
 *
 * Os três prefixos abaixo cobrem 100% dos slugs gerados por toda a
 * suíte de testes de API/integração hoje (`test/api/catalog.api.test.ts`,
 * `test/api/evaluation.api.test.ts`, `test/api/priceStats.api.test.ts`,
 * `test/integration/evaluation.integration.test.ts`) — não é uma lista
 * arbitrária, é a convenção real e única usada por todo o suite para
 * isolar dados de teste. Uma categoria/marca/loja real do catálogo
 * nunca usa esses prefixos (ver `prisma/publish*.ts` e o seed original).
 */
const TEST_SLUG_PREFIXES = ["api-", "it-eval-", "price-stats-"] as const;

export function isTestSlug(slug: string): boolean {
  return TEST_SLUG_PREFIXES.some((prefix) => slug.startsWith(prefix));
}
