# Changelog

Todas as mudanças notáveis deste projeto são documentadas aqui. Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/); versionamento segue [SemVer](https://semver.org/lang/pt-BR/) a partir desta release.

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
