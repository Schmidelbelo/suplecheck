# Changelog

Todas as mudanças notáveis deste projeto são documentadas aqui. Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/); versionamento segue [SemVer](https://semver.org/lang/pt-BR/) a partir desta release.

## [0.12.0] — 2026-09-08 — Publicação Oficial de Whey Protein (2ª categoria)

### Adicionado

- **Whey Protein torna-se a 2ª categoria oficialmente publicada da SupleScore**: 6 produtos reais publicados com preço/URL/proteína-por-dose verificados em página oficial alcançável (Max Titanium, Integralmédica, Adaptogen, Nutrata, Darkness, Probiótica Hiper). Primeiro ranking real de Whey Protein gerado.
- Marca nova: Darkness. Produtos novos: Nutrata W100 Whey Concentrado, Darkness Dark Whey Protein Concentrado, Probiótica Hiper 100% Whey — todos com dado citado por fonte.
- `prisma/expandWheyProteinCatalog.ts` — script de publicação, reaproveitando integralmente a metodologia/critérios já criados (nenhum peso novo).
- Comparações automáticas entre os 6 produtos publicados (via generalização já existente de `/comparar`, sprint anterior).

### Pesquisado, mas mantido em DRAFT (dado incompleto ou não verificável com segurança)

- Growth, Dux, Dark Lab: sites oficiais inacessíveis (bloqueio de bot/DNS), sem mudança desde a sprint anterior.
- Black Skull Whey 100% HD Gourmet, Vitafor Whey Fort 3W/Isofort, Probiótica 100% Pure Whey Zero Lactose, Atlhetica 100% Whey, BodyAction Isolate Prime Whey: preço confirmado em página oficial, mas proteína-por-dose divergente entre fontes ou campo obrigatório (tamanho de porção) não confirmado — não publicados para não arriscar dado impreciso.
- Max Titanium Super Whey e Integralmédica Nutri Whey: encontrados na pesquisa, mas são formulações hipercalóricas (blend com 79-80g de carboidrato por dose), não "whey protein" no sentido avaliado pela metodologia atual — excluídos da lista de publicação por não se encaixarem na categoria, não por falta de dado.

### Corrigido (dívida operacional, não de produto)

- Removidos ~18 registros de teste (categorias/produtos/marcas) que vazaram para o banco real durante falhas de conexão do Neon em sprints anteriores.

### Testes

- 179/179 passam quando isolados; execução em paralelo completa e o build de produção ficaram excepcionalmente instáveis nesta sessão por indisponibilidade intermitente do Neon (taxa de sucesso de conexão observada ~60-70% nesta janela) — nunca uma falha de lógica. Build de produção obtido com sucesso após múltiplas tentativas.

## [0.11.0] — 2026-09-06 — Generalização da Rota de Produto por Categoria

### Adicionado

- `src/lib/catalog/productRoutes.ts` — único ponto do projeto que decide a URL de categoria/produto (`categoryBasePath`/`productDetailPath`), substituindo o `CATEGORY_ROUTE_OVERRIDES` que estava duplicado em 2 arquivos.
- `src/modules/evaluation/components/ProductDetailPage.tsx` — renderização de página de produto extraída de `/creatina/[slug]`, agora compartilhada por `/creatina/[slug]` e pela nova rota `/categorias/[slug]/[produto]`. Nenhuma lógica de apresentação duplicada entre as duas.
- Nova rota `/categorias/[slug]/[produto]` — página de detalhe de produto para qualquer categoria sem rota própria (hoje, todas exceto creatina). Redireciona (307) para `/creatina/[produto]` quando `[slug]` é uma categoria com rota própria, evitando conteúdo duplicado.
- `ProductPresentation.categoryName` — nome de exibição da categoria (antes só o slug estava disponível), usado nos breadcrumbs/rótulos da página de produto.

### Corrigido

- **Bug real encontrado durante a auditoria**: acessar `/creatina/{slug-de-produto-de-outra-categoria}` não retornava 404 — a página renderizava normalmente, rotulada "Creatina", com o ranking errado. `ProductDetailPage` agora valida que a categoria real do produto bate com a da URL antes de renderizar; caso contrário, 404.
- ~15 pontos com link de produto hardcoded para `/creatina/${slug}` generalizados para usar `productDetailPath` (ranking, cards, comparações, ofertas, página de marca, recomendações, redirect de `/go/[productId]` para produto sem oferta): `RankingEntryCard`, `AlternativeRecommendationCard`, `OfferCard`, `RecommendationResultView`, `WeeklyHighlights`, `RankingPreview`, `DashboardClient` (itens vindos do ranking), `/comparar/[pair]`, `/ofertas`, `/marcas/[slug]`, `productSchema` (JSON-LD), `sitemap-produtos.xml`, `outboundClick.service`/`/go/[productId]`.
- Escopo deliberadamente fora desta sprint (mudaria o schema de dado local no navegador, não é "generalização de rota"): links de "recentemente vistos" e alertas de preço em `DashboardClient`/`AlertsCenterClient` continuam assumindo creatina — sem risco prático hoje, pois nenhum produto de outra categoria está publicado.

### Testes

- `test/api/go.api.test.ts` atualizado: o teste já usava uma categoria de teste (não "creatina") e agora corretamente espera o redirect para `/categorias/{categoria-de-teste}/{produto}` em vez do `/creatina/` hardcoded anterior — a correção do bug já se refletia nesse teste.
- Fixtures de teste (`buildComparisonPage.test.ts`, `comparisonPage.service.test.ts`, `dashboardStats.test.ts`) atualizadas com o novo campo `categoryName`.

## [0.10.1] — 2026-09-06 — Dados Reais de Whey Protein (captura, sem publicação)

### Adicionado

- `prisma/publishWheyProteinRealData.ts` — captura preço, URL, dosagem e atributos nutricionais reais (pesquisados e citados por fonte) para 3 dos 10 produtos de Whey Protein: Max Titanium, Integralmédica e Adaptogen. Avalia os 3 pelo motor real (`EvaluateSupplementUseCase`), reaproveitando a metodologia já criada na sprint anterior — nenhum peso ou critério novo.

### Achado (bloqueio descoberto durante smoke test, não corrigido nesta sprint)

- **Não existe página de detalhe de produto para nenhuma categoria além de creatina** — `/creatina/[slug]` é uma rota própria e hardcoded; `/categorias/[slug]/[produto]` não existe. Publicar os 3 produtos com dado confirmado deixaria o ranking de Whey Protein cheio de links "ver detalhes" resultando em 404. Por decisão explícita, os 3 produtos permanecem `DRAFT` (preço/nota/atributos já gravados, prontos) até essa rota ser generalizada.

### Corrigido (dívida operacional, não de produto)

- Removidos ~13 registros de catálogo (categorias/produtos/marcas/lojas de teste, ex.: `price-stats-cat-*`, `pc-cat-*`) que vazaram para o banco real após falhas de conexão do Neon durante os testes desta sprint — apareciam incorretamente no sitemap de produtos.

### Testes

- 179/179 passam quando isolados; execução completa em paralelo ficou instável nesta sessão por causa de indisponibilidade intermitente do Neon (nunca uma falha de asserção) — ver relatório da sprint.

### Adicionado

- Whey Protein passa a ter uma metodologia própria (`whey-protein-methodology`), reutilizando integralmente os 6 critérios embutidos do Core Domain já usados por creatina (nenhum critério novo criado) — mesmos pesos, por serem a filosofia real já validada da SupleScore, nunca inventados para esta categoria.
- `prisma/seedWheyProtein.ts` (`npm run db:seed:whey-protein`) — 10 produtos reais (um por marca prioritária: Growth, Max Titanium, Integralmédica, Dux, Dark Lab, Black Skull, Probiótica, Adaptogen, Vitafor, BodyAction), com nome e proteína-por-dose pesquisados e citados por fonte (site oficial/varejo), criados como `DRAFT` — sem preço, loja ou nota inventados. Publicação/avaliação fica para quando o preço e a loja reais forem capturados.
- 3 marcas novas no catálogo: Dark Lab, Adaptogen, BodyAction.

### Corrigido

- **`sitemap-produtos.xml` só incluía produtos de creatina** — qualquer outra categoria publicada seria invisível para o Google. Corrigido para listar produtos publicados de qualquer categoria, com a rota de detalhe correta por categoria.
- **`/categorias/[slug]` nunca renderizava um ranking de verdade** — mesmo com produtos avaliados, a página sempre mostrava o estado "ainda não há produtos". Agora reutiliza exatamente os mesmos componentes de `/creatina` (`RankingFilters`, `CategoryStatisticsSection`, `ShareButton`) para qualquer categoria sem rota própria.
- **`/comparar` só gerava pares de comparação de creatina** — agora itera por todas as categorias ativas com ranking real.

### Testes

- 179/179 testes existentes continuam passando (2 retries por cold-start do Neon, comportamento conhecido).

## [0.9.1] — 2026-09-04 — Auditoria Final do Rebranding e Roadmap 1.0

### Adicionado

- `SPRINT_REBRANDING_FINAL.md` — auditoria final pós-rebranding: confirma ausência de ocorrências residuais de "SupleCheck" (exceto identificadores internos de arquitetura deliberadamente preservados), varredura de dívida técnica (TODO/FIXME/mocks/dependências não usadas/código morto) e validações completas de qualidade (typecheck, lint, testes, build, bundle, segurança, performance/SEO/acessibilidade). Encerra oficialmente a Sprint de Rebranding.
- `ROADMAP_1_0.md` — documento mestre de produto até a versão 1.0, organizado em 7 fases priorizadas (Lançamento Beta, Primeiros Usuários, Crescimento SEO, Monetização, Autoridade, Escala, Versão 1.0), cada uma com objetivo, funcionalidades, entregas, critérios de aceite, impacto esperado, complexidade, ROI e dependências, além de backlog priorizado/opcional, ideias futuras, dívida técnica, riscos e metas de negócio/tráfego/receita com KPIs por fase. Nenhum código foi implementado nesta sprint — só planejamento.

## [0.9.0] — 2026-09-04 — Rebranding: SupleCheck → SupleScore

### Alterado

- **Rebranding completo**: todas as ocorrências do nome do produto foram substituídas de "SupleCheck" para "SupleScore" — interface, metadata, SEO, OpenGraph, Twitter Cards, JSON-LD (`Organization`, `Product`/`Review`, `WebSite`/`SearchAction`), `robots.txt`, sitemaps, logotipo textual (`Logo.tsx`, `brandMark.tsx` — inclusive imagens OG/Twitter/ícones geradas via `next/og`), páginas institucionais (sobre, metodologia, como avaliamos, como ganhamos dinheiro, contato, privacidade, cookies, termos), README, ARCHITECTURE.md e demais documentação técnica.
- `NEXT_PUBLIC_SITE_URL` — fallback padrão em `src/config/site.ts` atualizado para `https://suplescore.com.br` (domínio raiz canônico; a variável real de produção, gerenciada no painel da Vercel, segue com o operador do projeto).
- `package.json` (raiz) renomeado para `suplescore`; `package-lock.json` resincronizado.
- Chaves de `localStorage` (favoritos, histórico, alertas de preço, e-mail capturado etc.) migradas do prefixo `suplecheck:` para `suplescore:` — decisão segura porque o projeto ainda está pré-Beta (nenhum usuário real teria dado local a perder).

### Não alterado (deliberado — fora do escopo de rebranding, arquitetura preservada)

- Escopos de pacote interno do monorepo (`@suplecheck/core`, `@suplecheck/application`, `@suplecheck/infrastructure`) e a classe de domínio `SupleCheckIndexResult` — identificadores internos de arquitetura, não texto de marca voltado ao usuário; renomeá-los exigiria tocar imports, `package.json` de cada pacote e resolução de workspace, fora do que a sprint pediu ("não alterar arquitetura").
- Banco de dados: nenhum nome de tabela/coluna/model foi alterado, só comentários (`prisma/schema.prisma`).
- Rotas públicas e contratos de API: inalterados.

## [0.8.0] — 2026-09-03 — Preparação Comercial para Monetização Real

### Adicionado

- `buildAffiliateUrl()` agora aceita um segundo formato de `Store.affiliateBaseUrl`: uma querystring pura (sem `{url}`, sem `://`), mesclada nos parâmetros já existentes da URL de destino em vez de substituir um template — cobre o modelo de _tag_ da Amazon Associates (query param na própria URL do produto, não um wrapper de terceiro), a única lacuna estrutural real encontrada na auditoria da sprint anterior. Nenhum valor real foi inventado — o campo continua vazio no banco.
- `AFFILIATES.md` ganhou uma tabela única de preparação comercial (loja, programa, status, cadastro/aprovação/extensão/API necessários, formato esperado de `affiliateBaseUrl`, observações) cobrindo as 3 lojas hoje no catálogo (Amazon, Netshoes, Loja Oficial da Marca — placeholder) e as 5 marcas pesquisadas para expansão (Growth, Soldiers Nutrition, Dark Lab, Integralmédica, Max Titanium, Adaptogen), e uma confirmação explícita, loja a loja, de que nenhum ajuste técnico adicional é necessário após aprovação — só a configuração de `Store.isAffiliate`/`Store.affiliateBaseUrl`.

### Testes

- 4 testes novos para o modo "anexar parâmetro" de `buildAffiliateUrl` (tag simples, preservação de query params existentes, `?` opcional no início, fallback seguro para URL de destino inválida).

## [0.7.0] — 2026-09-03 — Captura de Leads e Preparação para Alertas por E-mail

### Adicionado

- Captura de e-mail agora presente em 3 pontos além do rodapé/home: criação de alerta de preço (`PriceAlertForm` — opcional, exibida só depois que o alerta já existe), e a área "Minha Área" (`DashboardClient` — exibida só quando este navegador ainda não deu um e-mail em nenhum formulário). Todos os formulários reutilizam o mesmo `LeadCaptureForm`, integrado ao `/api/leads` já existente (upsert idempotente por e-mail).
- `useCapturedEmail` — hook local (mesmo padrão de `useFavorites`/`usePriceAlerts`) que lembra, só neste navegador, que o visitante já deu o e-mail em algum formulário, para não pedir de novo; nunca é a fonte da verdade (o `Lead` real é sempre persistido no servidor).
- `LeadCaptureForm` ganhou `successMessage` e `onSuccess` customizáveis (antes só usados com o texto padrão de "ranking"), além de tratamento explícito de erro de rede (antes uma falha no `fetch` não tinha handler e não avisava o usuário).
- Ao criar um alerta de preço, o e-mail informado (opcional) é salvo tanto no `Lead` real quanto no próprio `PriceAlert.email` local — campo que já existia reservado para isso, agora finalmente usado.

### Não incluído (intencional)

- Nenhum envio de e-mail foi implementado nesta sprint — toda a cópia de UI deixa isso explícito ("assim que ativarmos o envio"). Fica para a sprint seguinte.

## [0.6.0] — 2026-09-03 — Monetização por Afiliados

### Adicionado

- **Monetização por afiliados**: serviço centralizado (`buildAffiliateUrl`) que decide a URL final de todo clique de saída — link de afiliado real quando `Store.isAffiliate`/`Store.affiliateBaseUrl` estiverem configurados (contrato próprio com placeholder `{url}`, sem inventar parâmetro de nenhuma rede real), fallback honesto para a URL normal nos demais casos.
- Nova rota `/go/[productId]` (redirect 302) — único ponto de saída da aplicação; os 2 links reais que apontavam direto para a loja (CTA principal e barra fixa mobile de `/creatina/[slug]`) foram migrados.
- Nova tabela `outbound_clicks` (produto, loja, categoria, origem, posição no ranking, se foi afiliado) — base para métricas de CTR por loja/categoria.
- `AFFILIATES.md` — arquitetura, fluxo de redirecionamento, contrato de configuração por loja e auditoria técnica (sem integração ativada) dos programas de afiliado de Amazon, Netshoes, Growth, Soldiers Nutrition, Dark Lab, Integralmédica, Max Titanium e Adaptogen.
- `npm run repair:price-urls` — script de reparo único de dado histórico (não um workaround de pipeline).

### Corrigido

- **Causa raiz da URL da oferta nunca sendo persistida**: `PriceCaptureJobRunner` nunca incluía o campo `url` ao gravar uma nova `PriceEntry` — toda captura automática gravava `url: null` silenciosamente, mesmo com uma URL real conhecida. Corrigido na origem: `PriceScraperResult`/`NormalizedPrice` agora carregam a URL de ponta a ponta pelo pipeline (Scraper → Validação → Normalização → Persistência), e a captura mais recente é sempre a fonte oficial — nunca um valor herdado silenciosamente na camada de persistência. Os 10 produtos reais do catálogo foram reparados (`repair:price-urls`) e revalidados com uma execução completa do pipeline corrigido.

### Testes

- 13 testes novos para monetização (`affiliateUrl`, `outboundLinkHref`, `/go/[productId]` end-to-end).
- 8 testes novos para o pipeline de captura (URL válida/vazia/malformada) e 5 novos cenários de integração (criação de produto sem histórico, atualização de preço, alteração de URL, mudança de loja, múltiplas capturas sucessivas).

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
