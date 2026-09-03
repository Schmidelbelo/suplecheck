# Changelog

Todas as mudanças notáveis deste projeto são documentadas aqui. Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/); versionamento segue [SemVer](https://semver.org/lang/pt-BR/) a partir desta release.

## [0.5.0] — 2026-09-03 — SEO Programático e Correções de Indexação

### Adicionado

- **Landing pages automáticas**: `/marcas` + `/marcas/[slug]`, `/categorias` + `/categorias/[slug]` — resumo, estatísticas, produtos relacionados, FAQ real e links internos, tudo a partir de dados reais do catálogo.
- **Páginas de comparação permanentes**: `/comparar` (índice) + `/comparar/[pair]` (`/comparar/produto-a-vs-produto-b`) — título SEO próprio, diferenças por critério, vantagens/desvantagens, conclusão e URL canônica (ordem alfabética dos slugs).
- **Compartilhamento**: `ShareButton` (Web Share API com fallback para copiar link) em produto, ranking e comparação.
- **Busca refletida na URL** (`/creatina?q=`), habilitando `SearchAction` real no `WebSite` JSON-LD.
- **Sitemap segmentado**: `sitemap-produtos.xml`, `sitemap-marcas.xml`, `sitemap-categorias.xml`, `sitemap-comparacoes.xml`, todos referenciados em `robots.txt`, gerados automaticamente a partir do catálogo.
- Links internos "Produtos da mesma marca" e "Produtos na mesma faixa de preço" na página de produto.

### Corrigido

- **`notFound()`/`redirect()` do Next.js retornavam HTTP 200 em vez de 404/307** em toda a aplicação (incluindo páginas anteriores a esta sprint, como `/creatina/[slug]`). Causa raiz: presença de `loading.tsx` em segmentos de rota (inclusive o da raiz, `app/loading.tsx`) força o Next a transmitir (stream) a resposta — uma vez iniciado o streaming, o status HTTP fica travado em 200 antes que `notFound()`/`redirect()` consigam influenciá-lo (comportamento documentado do App Router, não um bug da aplicação). Corrigido removendo os três `loading.tsx` que cobriam rotas com esse comportamento (raiz, `/creatina`, `/creatina/[slug]`) — nunca um workaround, eliminação do mecanismo causador.

### Refatorado

- `schema.tsx` dividido em `schema.ts` (geradores de JSON-LD, funções puras) e `JsonLd.tsx` (componente React) — permite testar os geradores sem depender de JSX.
- Montagem do ranking (`/api/evaluation/rankings/[categorySlug]/view`) extraída para `rankingView.service.ts`, reaproveitada diretamente por páginas server-side (marca, categoria, comparação) sem round-trip HTTP interno.

### Documentado

- `docs/DEPLOY.md` — nova seção "Limitações conhecidas": registra que `next dev` pode devolver HTTP 500 (em vez de 404) para um produto inexistente, causa raiz (duplicação de identidade de módulo do bundler de desenvolvimento em imports mistos alias/relativo de `packages/application`), confirmação de que produção (`next start`/Vercel) sempre se comporta corretamente, e a decisão de não corrigir (seria um refactor amplo sem ganho de produção). Item oficialmente encerrado.

### Testes

- 18 testes novos cobrindo `comparisonSlug`, `buildComparisonPageData`, `comparisonPage.service` e os geradores de JSON-LD (SearchAction, Breadcrumb, ItemList, FAQPage).
