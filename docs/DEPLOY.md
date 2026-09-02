# Deploy de produção — SupleCheck

Checklist e referência para colocar o SupleCheck no ar. Escrito na FASE 1.5
("Beta Público") — cobre só infraestrutura/configuração, nenhuma
funcionalidade de negócio nova.

## 1. Pré-requisito crítico: banco de dados

**Concluído.** O projeto usa PostgreSQL (Neon) tanto em desenvolvimento
quanto em produção — mesmo projeto Neon, schema único, uma só linha de
migrations (`provider = "postgresql"` em `prisma/schema.prisma`,
`DATABASE_URL` pooled + `DIRECT_URL` direta, ver `.env.example`). SQLite
não é mais usado em lugar nenhum do projeto (era inviável em produção
serverless — Vercel/Netlify têm sistema de arquivos efêmero em runtime).

**Também concluído**: `npx prisma migrate deploy` e `npm run db:seed`
já foram executados contra o projeto Neon usado por este ambiente —
banco populado com 5 categorias, 10 marcas, 3 fabricantes, 10 creatinas
(produto + SKU + preço + imagem), 6 critérios, 1 metodologia ativa, 10
scores calculados e 1 ranking gerado. Confirmado sem dados residuais de
teste (auditoria pré-Beta encontrou e removeu registros de teste com
prefixo `api-eval-` deixados por uma execução de suíte interrompida).

Pendente apenas quando um **host de deploy novo** (diferente do usado
até aqui) for configurado:

1. Confirmar `DATABASE_URL`/`DIRECT_URL` do mesmo projeto Neon
   configuradas nas env vars desse host.
2. Rodar `npx prisma migrate deploy` uma vez contra esse ambiente
   (idempotente — não reaplica migrations já aplicadas).
3. `npm run db:seed` não precisa rodar de novo — mesmo banco Neon já
   populado; rodar de novo é seguro (idempotente) mas não é necessário.

## 2. Variáveis de ambiente

| Variável                                              | Obrigatória | Descrição                                                                                                                                                                      |
| ----------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                                        | Sim         | Connection string "pooled" (com `-pooler`) do Postgres de produção — usada em runtime                                                                                          |
| `DIRECT_URL`                                          | Sim         | Connection string direta (sem `-pooler`) — usada só por `prisma migrate deploy`                                                                                                |
| `ADMIN_API_KEY`                                       | Sim         | Autentica toda escrita (`POST`/`PUT`/`PATCH`/`DELETE`) em `/api/catalog/*` e `/api/evaluation/*` (ver `src/middleware.ts`) — sem ela, essas rotas respondem 500. Gerar com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`, enviar como header `x-api-key` |
| `NEXT_PUBLIC_SITE_URL`                                | Sim         | URL pública final (ex.: `https://www.suplecheck.com.br`) — usada em metadata, sitemap, OG, JSON-LD. Errar isso quebra canonical/sitemap/rich results silenciosamente.          |
| `NEXT_PUBLIC_GA_ID`                                   | Não         | ID do Google Analytics 4 (`G-XXXXXXXXXX`) — sem isso, GA4 simplesmente não carrega (ver `AnalyticsScripts.tsx`)                                                                |
| `NEXT_PUBLIC_CLARITY_ID`                              | Não         | ID do projeto Microsoft Clarity                                                                                                                                                |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`                | Não         | Código de verificação "meta tag HTML" do Google Search Console                                                                                                                 |
| `NEXT_PUBLIC_SENTRY_DSN`                              | Não         | DSN do projeto Sentry — sem isso, o SDK fica instalado mas inativo (não envia nada, não quebra nada)                                                                           |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Não         | Só necessárias para o upload automático de source maps no build (stack traces legíveis no Sentry) — sem elas, o monitoramento de erros funciona normalmente, só sem source map |
| `RESEND_API_KEY`                                      | Não         | E-mail transacional (captura de lead) — hoje sem isso o envio é só logado (`NullMailProvider`)                                                                                 |

Todas documentadas com comentário em `.env.example`.

## 3. Domínio

Este é um passo manual, fora do código:

1. Comprar/ter o domínio (`suplecheck.com.br` é o valor-padrão hardcoded
   em `src/config/site.ts` como fallback — **o valor real vem sempre de
   `NEXT_PUBLIC_SITE_URL` em produção**, o fallback só existe para
   nunca deixar a variável undefined).
2. Apontar o DNS (registro A/CNAME, conforme o host escolhido).
3. Configurar o domínio customizado no painel do host.
4. Definir `NEXT_PUBLIC_SITE_URL` com o domínio final, com `https://`.
5. Confirmar HTTPS ativo (a maioria dos hosts modernos — Vercel,
   Netlify — provisiona certificado automaticamente).

## 4. Google Search Console

1. Criar a propriedade em <https://search.google.com/search-console> com
   o domínio final.
2. Verificar por "meta tag HTML" (copiar só o valor `content="..."` para
   `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`) — a tag já é injetada
   automaticamente pelo `layout.tsx` quando essa env existe.
3. Redeploy (a env só é lida em build/runtime do servidor).
4. Confirmar verificação no próprio Search Console.
5. Submeter `https://SEU_DOMINIO/sitemap.xml` na seção Sitemaps.
6. Usar "Inspeção de URL" em `/creatina` e em um `/creatina/[slug]` para
   confirmar que o Google consegue renderizar a página e que os dados
   estruturados (Product/Offer/Review) são reconhecidos.

## 4b. Bing Webmaster Tools

1. Criar a propriedade em <https://www.bing.com/webmasters> com o
   domínio final (ou importar direto do Google Search Console — não
   exige a env abaixo nesse caso).
2. Verificar por "meta tag" (copiar só o valor `content="..."` para
   `NEXT_PUBLIC_BING_SITE_VERIFICATION`) — a tag já é injetada
   automaticamente pelo `layout.tsx` quando essa env existe.
3. Redeploy.
4. Submeter `https://SEU_DOMINIO/sitemap.xml` na seção Sitemaps.

## 5. Analytics (GA4 e Clarity)

1. Criar a propriedade GA4 em <https://analytics.google.com>, copiar o
   Measurement ID (`G-...`) para `NEXT_PUBLIC_GA_ID`.
2. Criar o projeto em <https://clarity.microsoft.com>, copiar o Project
   ID para `NEXT_PUBLIC_CLARITY_ID`.
3. Redeploy. Os dois scripts (`AnalyticsScripts.tsx`) só são injetados
   quando o respectivo ID existe — nada roda em preview/dev sem
   configuração.

## 5b. Autenticação da API de escrita

Não há login de usuário nesta fase — o catálogo (Categorias, Marcas,
Fabricantes, Produtos, SKUs) e a Avaliação (Metodologias, recálculo de
score, geração de ranking) são gerenciados via API Key única, checada em
`src/middleware.ts` para todo `POST`/`PUT`/`PATCH`/`DELETE` em
`/api/catalog/*` e `/api/evaluation/*`. `/api/leads` e `/api/contact`
continuam públicos por design (captura de lead e formulário de contato).

1. Gerar um valor forte: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
2. Definir `ADMIN_API_KEY` com esse valor no host de deploy.
3. Enviar como header `x-api-key: <valor>` em toda requisição
   administrativa (ex.: `curl -X POST .../api/catalog/brands -H "x-api-key: ..."`).
4. Sem a env configurada, toda escrita responde `500`
   (`SERVER_MISCONFIGURED`) — nunca fica aberta por acidente. Com a env
   configurada, header ausente responde `401`, chave incorreta `403`.

`/api/leads` e `/api/contact`, por serem públicos, têm rate limiting
próprio (5 requisições/minuto por IP, também em `src/middleware.ts`) —
excesso responde `429` com header `Retry-After`. Limitação conhecida:
o contador vive em memória do processo, então reseta a cada
redeploy/restart e não é compartilhado entre instâncias simultâneas.

## 6. Monitoramento de erros (Sentry)

1. Criar conta/projeto Next.js em <https://sentry.io>.
2. Copiar o DSN para `NEXT_PUBLIC_SENTRY_DSN`.
3. (Opcional, para stack traces legíveis) gerar um Auth Token e definir
   `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` — isso faz o
   build subir source maps automaticamente.
4. Erros de cliente (`error.tsx`, `global-error.tsx`), de servidor e de
   edge (middleware) já são capturados — ver `instrumentation.ts`,
   `instrumentation-client.ts`, `sentry.server.config.ts`,
   `sentry.edge.config.ts`.

**Custo de performance conhecido**: o SDK de cliente do Sentry adiciona
~82KB ao JS compartilhado de toda página (confirmado via `next build`:
103KB → 185KB). Foi uma troca deliberada — monitoramento de erro real
em vez de nenhum — documentada aqui para revisão futura; se o impacto
em Core Web Vitals de campo (não só de laboratório) se mostrar
relevante, considerar capturar erros só em servidor/edge (remover
`instrumentation-client.ts`) como próximo ajuste.

## 7. Checklist final antes de abrir para usuários reais

- [x] Postgres de produção provisionado e migrado (`migrate deploy`)
- [x] Seed rodado (`npm run db:seed`) — 5 categorias, 10 marcas, 3 fabricantes, 10 creatinas, 6 critérios, 1 metodologia, 10 scores, 1 ranking; confirmado sem dados residuais de teste
- [x] `ADMIN_API_KEY` configurada e testada (401 sem header, 403 com chave errada, escrita funciona com a chave certa)
- [ ] `NEXT_PUBLIC_SITE_URL` apontando para o domínio final com HTTPS
- [ ] Domínio com certificado válido
- [x] `npm run build` limpo (typecheck + lint + build) no ambiente de deploy
- [ ] Search Console verificado e sitemap submetido
- [ ] Bing Webmaster Tools verificado e sitemap submetido
- [ ] GA4 e/ou Clarity recebendo eventos reais (checar em tempo real após um acesso de teste)
- [ ] Sentry recebendo um erro de teste (disparar um erro proposital e confirmar que aparece no painel)
- [ ] Lighthouse (Desktop + Mobile) rodado contra a URL final de produção — não foi possível rodar localmente nesta etapa (sem Chrome/Chromium disponível no ambiente de execução); rodar via PageSpeed Insights (<https://pagespeed.web.dev>) ou Lighthouse CI contra a URL de produção assim que houver deploy real
- [ ] Content-Security-Policy validada em produção (checar console do navegador em `/`, `/creatina` e `/creatina/[slug]` — nenhum recurso bloqueado; GA4/Clarity/Sentry devem continuar funcionando)
- [x] Rate limiting em `/api/leads` e `/api/contact` (5 requisições/minuto por IP, ver `src/middleware.ts`) — em memória, por instância; se o tráfego crescer a ponto de rodar múltiplas instâncias simultâneas, considerar migrar para um limiter distribuído (Upstash Redis/Vercel KV)
