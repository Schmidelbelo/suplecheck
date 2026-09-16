/**
 * Barreira de proteção contra dados de teste vazados no banco real
 * aparecendo em superfície pública (listagem, sitemap, API de catálogo,
 * página de categoria/marca/produto). Não é uma solução definitiva — a
 * limpeza real desses registros (arquivamento) é feita à parte, ver
 * `prisma/archiveTestFixtures.ts` e `docs/AUDITORIA_DADOS_TESTE.md`.
 *
 * Os cinco prefixos abaixo cobrem 100% dos slugs gerados por toda a
 * suíte de testes de API/integração hoje — `uniqueSuffix()`
 * (`test/setupTestContainer.ts`) gera sempre `{prefixo}-{timestamp}-
 * {aleatório}`, e todo teste usa um destes prefixos antes do sufixo:
 * `api-` (`test/api/catalog.api.test.ts`, `evaluation.api.test.ts`),
 * `it-` (`test/integration/*.integration.test.ts`, inclui o antigo
 * `it-eval-`), `go-` (`test/api/go.api.test.ts`), `pc-`
 * (`test/integration/priceCapture.integration.test.ts`) e
 * `price-stats-` (`test/api/priceStats.api.test.ts`). Não é uma lista
 * arbitrária, é a convenção real e única usada por todo o suite para
 * isolar dados de teste. Uma categoria/marca/loja/produto real do
 * catálogo nunca usa esses prefixos (ver `prisma/publish*.ts` e o seed
 * original).
 */
const TEST_SLUG_PREFIXES = ["api-", "it-", "go-", "pc-", "price-stats-"] as const;

export function isTestSlug(slug: string): boolean {
  return TEST_SLUG_PREFIXES.some((prefix) => slug.startsWith(prefix));
}
