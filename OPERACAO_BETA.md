# Operacao Beta — SupleScore

Documento operacional para o Beta publico. Ele descreve como operar o estado atual do codigo, sem pressupor funcionalidades administrativas que ainda nao existem.

## 1. Atualizar catalogo

O catalogo e gerenciado por APIs administrativas protegidas por `ADMIN_API_KEY`.

Checklist:

1. Confirmar que `DATABASE_URL`, `DIRECT_URL` e `ADMIN_API_KEY` estao configuradas no ambiente.
2. Usar o header `x-api-key: <ADMIN_API_KEY>` em toda escrita.
3. Criar ou atualizar dados de referencia antes do produto:
   - `POST /api/catalog/categories`
   - `POST /api/catalog/brands`
   - `POST /api/catalog/manufacturers`
4. Criar produto em `POST /api/catalog/products`.
5. Criar SKU em `POST /api/catalog/products/[idOrSlug]/skus`.
6. Publicar produto em `PATCH /api/catalog/products/[idOrSlug]/status`.
7. Calcular score em `POST /api/evaluation/products/[idOrSlug]/score`.
8. Regenerar ranking da categoria em `POST /api/evaluation/rankings/[categorySlug]`.
9. Validar pagina publica do produto e sitemap depois do deploy.

## 2. Atualizar precos

O pipeline atual de preco existe e e executavel, mas o scraper padrao (`LastKnownPriceScraperProvider`) apenas confirma o ultimo preco conhecido. Ele nao busca preco novo em lojas externas.

Opcoes atuais:

1. Atualizacao manual: inserir nova captura de preco no banco/API administrativa, mantendo URL real da oferta.
2. Execucao do job: chamar `GET /api/cron/price-capture` com `Authorization: Bearer <ADMIN_API_KEY>` ou `x-api-key`.
3. Dashboard operacional: acessar `/admin/jobs`, informar a API key e disparar/ver historico dos jobs.

Checklist apos atualizar preco:

1. Confirmar que a pagina `/ofertas` renderiza sem erro.
2. Confirmar que a pagina do produto mostra a oferta atual.
3. Confirmar que `/go/[productSlug]` redireciona para a URL esperada.
4. Confirmar que `outbound_clicks` registra cliques quando houver teste de saida.

## 3. Publicar nova categoria

1. Criar categoria ativa em `POST /api/catalog/categories`.
2. Criar ou associar produtos reais a essa categoria.
3. Criar metodologia ou ativar metodologia aplicavel.
4. Calcular scores dos produtos.
5. Gerar ranking da categoria.
6. Validar `/categorias/[slug]`.
7. Se a categoria tiver pagina propria como `/creatina`, criar rota especifica em sprint futura; no Beta atual, categorias sem rota propria vivem em `/categorias/[slug]`.
8. Confirmar entrada em `/sitemap-categorias.xml`.

## 4. Publicar nova marca

1. Criar marca ativa em `POST /api/catalog/brands`.
2. Associar produtos publicados a essa marca.
3. Calcular scores dos produtos e regenerar ranking da categoria.
4. Validar `/marcas/[slug]`.
5. Confirmar entrada em `/sitemap-marcas.xml`.

## 5. Publicar novo produto

1. Confirmar categoria, marca e fabricante.
2. Criar produto como rascunho.
3. Criar SKU com GTIN quando conhecido.
4. Registrar preco/oferta real com URL de loja.
5. Publicar produto.
6. Calcular score.
7. Regenerar ranking.
8. Validar:
   - `/creatina/[slug]` quando for creatina.
   - `/marcas/[brandSlug]`.
   - `/categorias/[categorySlug]`.
   - `/comparar`.
   - `/sitemap-produtos.xml`.
   - `/sitemap-comparacoes.xml`.

## 6. Fazer deploy

1. Configurar no host:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `ADMIN_API_KEY`
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_GA_ID` quando GA4 estiver ativo
   - `NEXT_PUBLIC_CLARITY_ID` quando Clarity estiver ativo
   - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
   - `NEXT_PUBLIC_BING_SITE_VERIFICATION`
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `RESEND_API_KEY` quando envio de e-mail for ativado
2. Rodar `npx prisma migrate deploy`.
3. Rodar `npm run build`.
4. Publicar o build Next.js.
5. Confirmar que o dominio final aponta para este deploy.
6. Confirmar HTTPS.
7. Confirmar redirecionamento entre `www` e sem `www`.

## 7. Restaurar banco

O projeto usa PostgreSQL/Neon. A restauracao deve ser feita no provedor do banco.

Procedimento recomendado:

1. Abrir o painel Neon.
2. Identificar o branch/backup correto.
3. Restaurar em um branch temporario antes de sobrescrever producao.
4. Atualizar `DATABASE_URL`/`DIRECT_URL` temporariamente para validar a restauracao.
5. Rodar validacoes:
   - `npx prisma validate`
   - `npx prisma migrate status`
   - `npm run build`
6. Validar paginas principais contra o banco restaurado.
7. Promover/restaurar para producao somente depois da validacao.

## 8. Validar producao

Checklist minimo antes de abrir trafego:

1. `https://DOMINIO_FINAL/` responde 200.
2. A variante com ou sem `www` redireciona corretamente para a canonical escolhida.
3. `/robots.txt` responde 200.
4. `/sitemap.xml` responde 200 e referencia:
   - `/sitemap-produtos.xml`
   - `/sitemap-marcas.xml`
   - `/sitemap-categorias.xml`
   - `/sitemap-comparacoes.xml`
5. Uma pagina de produto responde 200.
6. Uma pagina de marca responde 200.
7. Uma pagina de categoria responde 200.
8. Uma pagina de comparacao responde 200.
9. Uma URL inexistente responde 404.
10. Um redirect de comparacao fora de ordem responde 307/308 para a canonical.
11. `canonical`, OpenGraph, Twitter Card e JSON-LD aparecem no HTML.
12. GA4 recebe `page_view`.
13. Clarity grava sessao.
14. Sentry recebe erro de teste.
15. `/api/health` responde 200.
16. `/api/admin/*` e `/api/cron/*` rejeitam acesso sem API key.
17. `/api/leads` e `/api/contact` aplicam rate limit.
18. Lighthouse/PageSpeed fica acima de 90 nos quatro grupos ou as excecoes ficam documentadas.
