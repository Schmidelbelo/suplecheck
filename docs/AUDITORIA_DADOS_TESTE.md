# Auditoria de Dados de Teste Vazados em Produção

Gerada em 2026-09-16. Motivada por registros de teste observados em
`sitemap-produtos.xml`/`sitemap-marcas.xml` durante a validação local de
`18d5136` (`api-prod-...`) e pelo produto "Produto Price Stats" visível
sem imagem, reportado anteriormente.

## Causa raiz

`test/api/catalog.api.test.ts`, `test/api/priceStats.api.test.ts` e outros
testes de API/integração rodam contra o **mesmo Postgres (Neon) de
desenvolvimento** usado pelo app (`test/setupTestContainer.ts` — decisão
deliberada, testes reais contra Prisma+Postgres, não mocks). Cada teste
cria seus próprios registros com `uniqueSuffix()` (`{prefixo}-{timestamp}-
{aleatório}`) e limpa tudo num `cleanup()`/`afterAll`. Quando o teste cai
**antes** de chegar ao cleanup — na prática, a conexão com o Neon caindo
no meio da suíte, o mesmo sintoma observado nesta própria sessão (`Can't
reach database server at ep-fancy-flower-...`) — o registro fica órfão,
com `status: PUBLISHED`, indistinguível de um produto real para qualquer
leitura pública.

Uma camada de proteção em leitura (`src/lib/catalog/testDataGuard.ts`,
`isTestSlug()`) já existia para **categoria** desde `c521a12` (bloqueia
`/categorias/[slug]`, `/api/catalog/categories`, `sitemap-categorias.xml`).
Esta auditoria estende a mesma proteção para marca e produto, e faz a
limpeza real dos registros órfãos hoje no banco.

## Registros encontrados

| Tipo     | Slug                                     | Nome                  | Status         | Onde aparecia publicamente                                             | Ação                                                                                                                   |
| -------- | ---------------------------------------- | --------------------- | -------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| product  | `api-product-1789504019763-40675`        | Produto API           | PUBLISHED      | `sitemap-produtos.xml`, `/categorias/api-prod-cat-.../...`             | **Arquivado** (`ARCHIVED`)                                                                                             |
| product  | `api-product-1789502523787-54206`        | Produto API           | PUBLISHED      | `sitemap-produtos.xml`, `/categorias/api-prod-cat-.../...`             | **Arquivado** (`ARCHIVED`)                                                                                             |
| product  | `price-stats-product-1789158972060-4647` | Produto Price Stats   | PUBLISHED      | `sitemap-produtos.xml`, `/categorias/price-stats-cat-.../...`          | **Arquivado** (`ARCHIVED`)                                                                                             |
| brand    | `api-prod-brand-1789504019763-40675`     | Marca                 | `active: true` | `sitemap-marcas.xml`, `/marcas`, `/marcas/[slug]`                      | Bloqueado em leitura (`isTestSlug`); registro mantido — ver §5                                                         |
| brand    | `api-prod-brand-1789502523787-54206`     | Marca                 | `active: true` | idem                                                                   | idem                                                                                                                   |
| brand    | `price-stats-brand-1789158972060-4647`   | Marca Price Stats     | `active: true` | idem                                                                   | idem                                                                                                                   |
| category | `api-prod-cat-1789504019763-40675`       | Categoria             | `active: true` | `sitemap-categorias.xml` (já bloqueada desde `c521a12`), `/categorias` | Já bloqueado em leitura; registro mantido — ver §5                                                                     |
| category | `api-prod-cat-1789502523787-54206`       | Categoria             | `active: true` | idem                                                                   | idem                                                                                                                   |
| category | `price-stats-cat-1789158972060-4647`     | Categoria Price Stats | `active: true` | idem                                                                   | idem                                                                                                                   |
| sku      | 1 por produto acima (3 total)            | —                     | `ACTIVE`       | Nenhuma — SKU nunca é URL pública direta                               | Órfão junto do produto arquivado; sem ação própria (nenhum `priceEntry`, nada para arquivar além do status do produto) |

Nenhum `PriceEntry` foi encontrado para nenhum dos 3 SKUs de teste — por
isso nunca apareceram em `/admin/metrics` como "produto sem clique"
(esse relatório já exige oferta real, ver `18d5136`) nem em `/ofertas`
ou rankings (que dependem de `Ranking`/`ProductScore`, nunca gerados para
essas categorias de teste).

Cada marca/categoria de teste tem exatamente **1** produto vinculado — o
próprio produto de teste — confirmando que não há risco de uma marca ou
categoria de teste ter sido reaproveitada por um produto real depois.

## O que foi corrigido

### 1. Limpeza real — apenas produtos (`prisma/archiveTestFixtures.ts`)

Script com `DRY_RUN=1` por padrão (`npm run archive:test-fixtures`
roda em dry-run; `DRY_RUN=0 npm run archive:test-fixtures` aplica de
verdade). Escopo restrito a `Product.status` — nunca deleta a linha,
transiciona para `ARCHIVED` (o mesmo soft delete de
`DeleteSupplementUseCase`, Domain Model §3.1), e grava um `AuditLog`
(`actorType: SYSTEM`, `action: "test_fixture.archived"`) por produto
arquivado. Rodado nesta tarefa: **3 produtos arquivados**, confirmado
idempotente (segunda execução em dry-run não encontra mais nada a fazer).

### 2. Guardrail de leitura estendido (`src/lib/catalog/testDataGuard.ts`)

Prefixos cobertos por `isTestSlug()` expandidos de `["api-", "it-eval-",
"price-stats-"]` para `["api-", "it-", "go-", "pc-", "price-stats-"]` —
cobre 100% dos prefixos hoje usados por `uniqueSuffix()` em toda a
suíte (`test/api/*.test.ts`, `test/integration/*.test.ts`), não só os
dois padrões observados nesta auditoria. Aplicado em:

- `sitemap-produtos.xml` (novo) — filtra produto/categoria de teste
- `sitemap-marcas.xml` (novo) — filtra marca de teste
- `src/modules/brand/services/brandPage.service.ts` (novo) —
  `getBrandPageData` trata marca de teste como inexistente (404 real,
  mesmo padrão de `categoryPage.service.ts`); `listBrandsWithStats`
  (base de `/marcas`) filtra
- `src/app/api/catalog/brands/route.ts` (novo) — listagem sem busca
  explícita filtra, mesmo padrão de `/api/catalog/categories`
- `src/app/ofertas/page.tsx` (novo) — não varre categoria de teste ao
  montar a lista de categorias ativas (defesa em profundidade; já era
  inofensivo hoje porque nenhuma categoria de teste tem `Ranking`
  gerado)
- `sitemap-categorias.xml`, `/categorias/[slug]`, `/api/catalog/categories`
  — já cobertos desde `c521a12`, sem mudança

### 3. Guardrail automatizado (`test/integration/testDataGuard.integration.test.ts`)

Novo teste de integração que consulta o banco real e **falha** se
existir algum `Product` com `status: PUBLISHED` ou `IN_REVIEW` cujo slug
bate `isTestSlug()`. Roda como parte de `npm test`. Escopo deliberadamente
restrito a produto (ver §5 sobre marca/categoria) — é o sinal de
regressão caso um teste volte a vazar dado sem cleanup.

## O que foi apenas documentado (não corrigido)

### 5. Marca e categoria de teste — registros mantidos

As 3 marcas e 3 categorias de teste continuam no banco com `active: true`.
Decisão deliberada, não descuido:

- Já estão **invisíveis em toda superfície pública** (sitemap, listagem,
  página própria) pela proteção de leitura acima — o problema prático
  (vazamento) já está resolvido sem precisar tocar no registro.
- Remover/desativar marca ou categoria é uma operação com superfície de
  risco maior que arquivar produto: exigiria confirmar que nenhuma outra
  entidade (histórico de auditoria, relação futura) depende da linha
  continuar existindo, e o ganho é puramente cosmético (a linha nunca
  aparece pra ninguém de qualquer forma).
- Se o time quiser limpar essas 6 linhas por higiene (não por necessidade
  funcional), a ação segura é `active: false` — nunca delete físico,
  mesmo padrão de soft delete do resto do schema (`Category.active`,
  `Brand.active`) — mas isso fica fora do escopo desta tarefa.

## Verificação

- `npm run typecheck` — passa.
- `npm test` — inclui o novo guardrail (`testDataGuard.integration.test.ts`,
  passa após o arquivamento); falhas pré-existentes de ambiente (Neon
  inalcançável em alguns runs deste ambiente local) documentadas
  separadamente, não introduzidas por esta tarefa.
- Sitemaps revalidados localmente após a correção (`npm run dev` +
  `curl`): `sitemap-produtos.xml` e `sitemap-marcas.xml` não listam mais
  nenhum registro `api-prod-*`/`price-stats-*`.
- Nenhum afiliado, imagem ou dado comercial alterado.
