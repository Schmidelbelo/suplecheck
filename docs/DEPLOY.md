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

Passos ainda pendentes para o banco de **produção** especificamente
(o schema/migration já está pronto e testado, falta só popular e validar
o ambiente real):

1. Confirmar `DATABASE_URL`/`DIRECT_URL` de produção configuradas no
   host de deploy (mesmo projeto Neon, branch `main`).
2. Rodar `npx prisma migrate deploy` contra produção (nunca `migrate
dev` em produção) — já validado em desenvolvimento, ver auditoria da
   migração SQLite→Postgres.
3. Rodar `npm run db:seed` uma vez, para popular categorias/marcas/
   fabricantes/as 10 creatinas do MVP.

## 2. Variáveis de ambiente

| Variável                                              | Obrigatória | Descrição                                                                                                                                                                      |
| ----------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                                        | Sim         | Connection string do Postgres de produção                                                                                                                                      |
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

## 5. Analytics (GA4 e Clarity)

1. Criar a propriedade GA4 em <https://analytics.google.com>, copiar o
   Measurement ID (`G-...`) para `NEXT_PUBLIC_GA_ID`.
2. Criar o projeto em <https://clarity.microsoft.com>, copiar o Project
   ID para `NEXT_PUBLIC_CLARITY_ID`.
3. Redeploy. Os dois scripts (`AnalyticsScripts.tsx`) só são injetados
   quando o respectivo ID existe — nada roda em preview/dev sem
   configuração.

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

- [ ] Postgres de produção provisionado e migrado (`migrate deploy`)
- [ ] Seed rodado (`npm run db:seed`)
- [ ] `NEXT_PUBLIC_SITE_URL` apontando para o domínio final com HTTPS
- [ ] Domínio com certificado válido
- [ ] `npm run build` limpo (typecheck + lint + build) no ambiente de deploy
- [ ] Search Console verificado e sitemap submetido
- [ ] GA4 e/ou Clarity recebendo eventos reais (checar em tempo real após um acesso de teste)
- [ ] Sentry recebendo um erro de teste (disparar um erro proposital e confirmar que aparece no painel)
- [ ] Lighthouse (Desktop + Mobile) rodado contra a URL final de produção — os números de `docs/LIGHTHOUSE.md` foram medidos localmente; produção pode variar por causa de latência de rede real/CDN/edge
