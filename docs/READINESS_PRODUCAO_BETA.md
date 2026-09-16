# Prontidão para Produção Beta — SupleCheck

Gerado em 2026-09-16, contra `HEAD` = `58c3ced` (`v0.51.0`). Documento
único e autossuficiente para decidir e executar o corte final do Beta
público — não depende de nenhuma conversa anterior para ser seguido.
Onde este documento resume algo já documentado em detalhe em outro
arquivo, ele aponta para lá em vez de duplicar (e o arquivo-fonte
continua sendo a referência mais completa se algo aqui parecer
desatualizado).

**Regra deste documento**: nenhum número, link ou status aqui é
estimado. Onde algo depende de dado que só existe em produção real
(cobertura de monetização exata, contagem de imagens pendentes), o
documento aponta o comando/painel que mostra o valor atual em vez de
congelar um número que fica errado no dia seguinte.

---

## 1. Status técnico atual (confirmado nesta auditoria)

| Item                | Status                                                    | Evidência                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck` | ✅ limpo                                                  | Rodado nesta sessão, zero erro                                                                                                                                                                                                                                                                                                                       |
| `npm test`          | ✅ 198/198 passam                                         | Rodado nesta sessão (`vitest run`, 39 arquivos) — falhas anteriores nesta sessão foram só instabilidade de conexão com o Neon (erro de ambiente, não de código), reproduzido e documentado em execuções anteriores desta mesma auditoria                                                                                                             |
| Monetização técnica | ✅ honesta                                                | CTAs só via `/go`, `OutboundClick` grava todo clique, `/admin/monetizacao` mostra cobertura real, nenhum `affiliateBaseUrl` inventado                                                                                                                                                                                                                |
| SEO técnico         | ✅ auditado e corrigido                                   | `robots.txt` bloqueia `/admin/`, `/api/`, `/go/`; `sitemap.xml` não referencia mais `rss.xml`; JSON-LD `Product.offers.availability` usa dado real, nunca hardcoded — ver commit `18d5136`                                                                                                                                                           |
| Sitemaps            | ✅ validados localmente                                   | `sitemap.xml`, `sitemap-produtos.xml`, `sitemap-categorias.xml`, `sitemap-marcas.xml`, `sitemap-comparacoes.xml`, `sitemap-static.xml` — todos XML válido, todos com o domínio correto conforme `NEXT_PUBLIC_SITE_URL`, nenhum referenciando `/admin`, `/api` ou `/go`                                                                               |
| Dados de teste      | ✅ arquivados + guardrail ativo                           | 3 produtos de teste vazados (`Produto API` ×2, `Produto Price Stats`) arquivados (`ARCHIVED`, soft delete); `testDataGuard.ts` protege leitura pública de marca/categoria/produto; `test/integration/testDataGuard.integration.test.ts` falha automaticamente se um novo vazamento aparecer — ver `docs/AUDITORIA_DADOS_TESTE.md` (commit `58c3ced`) |
| Imagens             | ✅ concluído para o corte beta                            | 20/20 candidatos aprovados publicados no Vercel Blob em produção (1 no teste unitário + 19 no lote, 0 ignorados, 0 falhas) — validado com URL real do Blob e imagem visível no ranking/página de produto. 18 `PendingImage` seguem `PENDING` sem candidato (não bloqueiam o beta — ver §7)                                                           |
| Afiliados           | 🟡 em andamento, 3 lojas em estágios distintos — ver §3.1 | Amazon ativo (`tag=suplescore-20`) com pendência fiscal externa no portal; Mercado Livre ativo e com clique real registrado, mas o link do botão "Compartilhar" ainda não foi validado como formato oficial de afiliado; Netshoes/Rakuten com campanha aparentemente ativa, painel com problema de interação, suporte acionado                       |
| Deploy              | ⏳ não executado                                          | Vercel + domínio + env vars de produção ainda não configurados neste corte                                                                                                                                                                                                                                                                           |

**Nota de sequenciamento**: a frente de imagens está **estável e concluída** para este corte — os 18 `PendingImage` restantes ficam como pendência futura (pesquisa/upload manual), não tarefa imediata, e não bloqueiam nada. A frente ativa agora é **monetização/tracking** (afiliados), detalhada em §3.1 abaixo.

---

## 2. O que já está pronto (não bloqueia o corte)

- Build (`npm run build`), lint, typecheck e teste verdes.
- Banco de produção (Neon) já provisionado, migrado (`prisma migrate deploy`) e populado — ver `docs/DEPLOY.md §1`. Nenhuma migration pendente adicional criada nesta sessão.
- `robots.txt`, sitemaps, metadata padrão, canonical URLs, JSON-LD (Organization/WebSite sempre; Product/BreadcrumbList/ItemList quando fizer sentido) — auditados e corrigidos.
- `/admin/monetizacao` mostra cobertura real por loja/categoria, nunca um número inventado.
- `/admin/metrics` mostra funil de cliques: total, por loja, por produto, por categoria, **por origem (source)** — adicionado em `18d5136` — e afiliado vs. direto.
- `AnalyticsScripts` (GA4/Clarity) é seguro sem env var configurada (retorna `null`, não quebra o build nem a página) e só carrega depois de consentimento LGPD real.
- CSP, HSTS e demais headers de segurança já configurados em `next.config.ts` (ver §3).
- Redirect `www` → apex já configurado em `next.config.ts`.
- Pipeline de imagem (descoberta → candidato → aprovação → publicação no Blob) **executado em produção**: 20 imagens aprovadas publicadas com sucesso (0 falhas), confirmado via `/admin/imagens`, `/api/admin/images/pending` e visualmente no ranking de creatina — ver §7.
- Pipeline de afiliado (`configureStoreAffiliate.ts` com dry-run, `buildAffiliateUrl`, `OutboundClick.wasAffiliate`) implementado e testado — falta só o link/tag comercial real, não código.
- Guardrail de dado de teste ativo em toda superfície pública (sitemap, listagem, página de marca/categoria) + teste automatizado que falha se recorrer.

## 3. O que depende de insumo externo (bloqueadores reais do corte)

Nenhum destes é um problema de código — são decisões/acessos que só quem tem a conta/contrato pode fornecer.

| Insumo                                       | Bloqueia                                                                                          | Quem fornece                                                                                                                                              | Onde configurar                                                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Links/tags de afiliado reais adicionais      | Cobertura de monetização além do que já está ativo hoje (Amazon, 15 produtos)                     | Painel de cada programa de afiliado já aprovado/contratado (ver `docs/GESTAO_AFILIADOS.md`, `docs/DEPLOY_PRIMEIRA_RECEITA.md §3` para a lista priorizada) | `STORE_SLUG=... AFFILIATE_BASE_URL=... npx tsx prisma/configureStoreAffiliate.ts`                                                |
| Variáveis de ambiente de produção            | Deploy em si                                                                                      | Quem administra o projeto na Vercel/Neon                                                                                                                  | Ver §7 (lista completa)                                                                                                          |
| Deploy final                                 | Site no ar                                                                                        | Quem tem acesso ao painel da Vercel do domínio de produção                                                                                                | Ver §9 (ordem exata)                                                                                                             |
| Domínio + DNS + certificado                  | Site acessível pelo domínio real                                                                  | Quem administra o DNS do domínio                                                                                                                          | `next.config.ts` já redireciona `www.suplescore.com.br` → apex; confirmar o domínio real bate com esse hardcode se for diferente |
| Google Search Console / Bing Webmaster Tools | Indexação acelerada (o site funciona e é indexável sem isso, só demora mais sem submissão manual) | Quem tem acesso à conta Google/Microsoft da empresa                                                                                                       | `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` / `NEXT_PUBLIC_BING_SITE_VERIFICATION` (opcional, ver §6)                                 |

### 3.1 Status detalhado — afiliados (frente ativa)

Levantamento de 2026-09-16. Nenhum `affiliateBaseUrl` novo foi inventado ou configurado aqui — só o status de cada loja, conforme confirmado no painel de cada rede.

| Loja                   | Status técnico                                                                                                   | Pendência                                                                                                                                                                                             | Próximo passo                                                                                                                                                                              | Quem resolve                                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Amazon**             | Ativo — `Store.isAffiliate=true`, `affiliateBaseUrl="tag=suplescore-20"`, cliques saindo com `wasAffiliate=true` | Pendência **fiscal externa** no portal Amazon Associates (não é limitação técnica do SupleCheck)                                                                                                      | Resolver a pendência fiscal diretamente no portal da Amazon                                                                                                                                | Time comercial/financeiro, fora do código                                                                                                                  |
| **Mercado Livre**      | Conta ativa, cliques reais já sendo registrados (`OutboundClick`)                                                | O link gerado pelo botão "Compartilhar" do Mercado Livre **ainda não foi validado** como o formato oficial de link de afiliado (pode ser um link de compartilhamento comum, sem tracking de comissão) | Validar com o suporte/documentação do Mercado Livre qual é o formato oficial de link afiliado antes de configurar `affiliateBaseUrl` — **não inventar esse valor** enquanto não confirmado | Próximo passo técnico/comercial desta frente — ver `docs/GESTAO_AFILIADOS.md §1–§2` para o procedimento de configuração assim que o formato for confirmado |
| **Netshoes / Rakuten** | Campanha principal aparentemente ativa (não confirmado com certeza)                                              | Painel da Rakuten Advertising com **problema de interação** (não carrega/não responde de forma confiável) — suporte já acionado                                                                       | Aguardar retorno do suporte da Rakuten; sem acesso estável ao painel, não é possível confirmar/obter o ID de publisher necessário                                                          | Suporte Rakuten (ticket aberto), fora do controle do SupleCheck                                                                                            |

Nenhuma dessas três pendências é um bug de código — `buildAffiliateUrl()` já suporta os dois formatos necessários (wrapper `{url}` para Rakuten, querystring pura para Amazon) desde antes desta sessão, ver `AFFILIATES.md §3`.

## 4. Riscos conhecidos

Separados por origem — confundir os dois tipos é o erro mais comum em checklist de deploy.

### 4.1 Riscos técnicos (dentro do controle do time de engenharia)

| Risco                                                                                      | Severidade                             | Mitigação já existente                                                                                                                                      |
| ------------------------------------------------------------------------------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Neon com autosuspend causando cold-start lento/erro no primeiro acesso após período ocioso | Médio                                  | `/api/health` expõe o indicador `database`; confirmar antes do lançamento se o tier de produção tem autosuspend desativado (ver `BETA_OPERACIONAL.md §1.4`) |
| Limite de conexões do pooler do Neon sob concorrência real                                 | Médio (só se o tráfego crescer rápido) | Nenhuma mitigação de código ainda — monitorar painel do Neon nos primeiros dias (`BETA_OPERACIONAL.md §5.6`)                                                |
| Rate limiting em memória de processo (não distribuído)                                     | Baixo no volume do Beta                | Suficiente para o volume esperado do Beta; migrar para limiter distribuído é item de evolução pós-lançamento, não bloqueador                                |
| Cron de captura de preço/uptime não agendado em `vercel.json`                              | Baixo                                  | Deliberado — `/api/health` cobre a checagem manual diária até o volume justificar automação (ver `BETA_OPERACIONAL.md §5.2`)                                |

### 4.2 Riscos externos/de negócio (fora do controle do time de engenharia)

| Risco                                                                                      | Severidade | Nota                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mercado Livre e Netshoes/Rakuten ainda sem link de afiliado confirmado (ver §3.1)          | Médio      | Não é bug — Mercado Livre precisa validar o formato oficial do link antes de configurar `affiliateBaseUrl`; Netshoes/Rakuten depende do suporte resolver o painel; `/admin/monetizacao` mostra isso honestamente |
| Produtos publicados ainda usando card ilustrativo (sem foto real) até o Blob ser conectado | Baixo      | Honesto e visível — nunca finge ter foto real; card ilustrativo é o fallback correto, não um placeholder quebrado                                                                                                |
| CTR real (cliques ÷ impressão) não é mensurável ainda                                      | Baixo      | Sem instrumentação de impressão de card — indicador prático até lá é clique absoluto/dia (`BETA_OPERACIONAL.md §5.4`)                                                                                            |

---

## 5. Variáveis de ambiente

Todas documentadas com comentário em `.env.example` — esta tabela é o resumo operacional.

### 5.1 Obrigatórias (sem elas, o deploy não deve subir)

| Variável               | Descrição                                                                                                                                   | Onde é usada                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `DATABASE_URL`         | Connection string "pooled" (com `-pooler`) do Postgres de produção                                                                          | Runtime, toda leitura/escrita            |
| `DIRECT_URL`           | Connection string direta (sem `-pooler`)                                                                                                    | Só `prisma migrate deploy`/`migrate dev` |
| `ADMIN_API_KEY`        | Autentica escrita administrativa (`/api/catalog/*`, `/api/evaluation/*`, `/api/admin/*`) — sem ela, essas rotas respondem 401/500           | `src/middleware.ts`                      |
| `NEXT_PUBLIC_SITE_URL` | URL pública canônica final (`https://suplescore.com.br` ou o domínio real do corte) — usada em metadata, sitemap, OG, JSON-LD, `robots.txt` | `src/config/site.ts` (`siteConfig.url`)  |

### 5.2 Opcionais (o app funciona sem elas, com degradação graciosa documentada)

| Variável                                              | Efeito se ausente                                                                                         |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `BLOB_READ_WRITE_TOKEN`                               | Publicação de imagem indisponível — produto continua com card ilustrativo, nunca quebra a página          |
| `NEXT_PUBLIC_GA_ID`                                   | GA4 não carrega (`AnalyticsScripts` retorna `null` para esse script)                                      |
| `NEXT_PUBLIC_CLARITY_ID`                              | Clarity não carrega                                                                                       |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`                | Meta tag de verificação do Search Console não é emitida                                                   |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION`                  | Meta tag de verificação do Bing não é emitida                                                             |
| `NEXT_PUBLIC_SENTRY_DSN`                              | Sentry instalado mas inativo — não captura nada, não quebra nada                                          |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Build sem upload de source maps — stack trace do Sentry menos legível, monitoramento continua funcionando |
| `RESEND_API_KEY`                                      | E-mail de lead/alerta só é logado, nunca enviado de fato (`NullMailProvider`)                             |

Referência completa de cada variável, com exemplo de valor e onde obter: `.env.example` e `docs/DEPLOY.md §2`.

---

## 6. Comandos operacionais de referência

```bash
# Validação local antes de qualquer deploy
npm run typecheck
npm run lint
npm test
npm run build

# Migrations contra o Postgres de produção (idempotente)
npx prisma migrate deploy
npx prisma migrate status   # confirma "Database schema is up to date!"
npx prisma validate

# Guardrail de dado de teste — dry-run sempre primeiro
DRY_RUN=1 npm run archive:test-fixtures
DRY_RUN=0 npm run archive:test-fixtures   # só se o dry-run mostrar algo esperado

# Ativação de loja afiliada — dry-run sempre primeiro
STORE_SLUG=<slug> AFFILIATE_BASE_URL="<link/tag real>" DRY_RUN=1 \
  npx tsx prisma/configureStoreAffiliate.ts
STORE_SLUG=<slug> AFFILIATE_BASE_URL="<link/tag real>" \
  npx tsx prisma/configureStoreAffiliate.ts   # grava de verdade

# Publicação de imagem em lote via API (alternativa ao botão em /admin/imagens)
curl -X POST https://<domínio>/api/admin/images/publish-all -H "x-api-key: $ADMIN_API_KEY"

# Cobertura de monetização e fila de imagem — sempre o dado ao vivo, nunca um número congelado neste doc
curl https://<domínio>/admin/monetizacao   # ou abrir no navegador com a ADMIN_API_KEY
curl https://<domínio>/api/admin/images/pending -H "x-api-key: $ADMIN_API_KEY"
```

---

## 7. Procedimento — Imagens (Vercel Blob)

**Status: concluído para o corte beta (2026-09-16).** `BLOB_READ_WRITE_TOKEN`
conectado em produção, os 6 passos abaixo já foram executados de ponta a
ponta: 20/20 candidatos `APPROVED` publicados (1 no teste unitário via
`POST /api/admin/images/publish` + 19 no lote via `publish-all`, 0
ignorados, 0 falhas), validado com URL real do Blob abrindo publicamente
e foto real visível em produto/ranking. Restam **18 `PendingImage` em
`PENDING` sem `candidateUrl`** — não têm candidato aprovado para publicar
(exigem pesquisa/upload manual novo, ver `docs/DEPLOY_PRIMEIRA_RECEITA.md §4`),
continuam mostrando o card ilustrativo (comportamento correto, não é bug)
e **não bloqueiam o beta**. O procedimento abaixo continua sendo a
referência para a próxima leva de imagens aprovadas.

Ordem exata, cada passo depende do anterior. Detalhe completo em
`docs/DEPLOY_PRIMEIRA_RECEITA.md §1.1–1.3`.

1. **Conectar o Blob**: painel da Vercel → projeto → Storage → Create Database → Blob. A Vercel injeta `BLOB_READ_WRITE_TOKEN` sozinha no ambiente de produção.
2. **Confirmar a injeção**: `GET /api/admin/images/pending` (com `x-api-key`) deve responder 200 normalmente — esse endpoint não depende do Blob, só confirma que o deploy está saudável antes do próximo passo.
3. **Publicar 1 imagem isolada primeiro**: abrir `/admin/imagens`, clicar "Publicar no Blob" em um único card `APPROVED`. Confirma que o pipeline download → WEBP → Blob → `ProductImage` funciona de ponta a ponta antes de arriscar o lote inteiro.
4. **Validar essa publicação**: abrir a página do produto correspondente e confirmar visualmente que a foto real substituiu o card ilustrativo (`-card.webp`).
5. **Rodar o lote**: clicar "Publicar todos os aprovados" (ou `curl -X POST .../api/admin/images/publish-all`, ver §6). O toast/resposta mostra contagem de publicados/pulados.
6. **Revalidar placeholders**: `GET /api/admin/images/pending` — o total de itens na fila deve ter caído para só os que continuam sem candidato aprovado (esses continuam mostrando o card ilustrativo — esperado, não é bug, exigem pesquisa/upload manual novo).

## 8. Procedimento — Afiliados

Ordem exata. Nunca pular o dry-run. Detalhe completo em
`docs/DEPLOY_PRIMEIRA_RECEITA.md §1.4, §2` e `docs/GESTAO_AFILIADOS.md`.

1. **Ter o link/tag real em mãos** — vindo do painel do programa de afiliados já aprovado/contratado. Nunca estimar ou inventar.
2. **Dry-run**: `STORE_SLUG=<slug> AFFILIATE_BASE_URL="<link/tag real>" DRY_RUN=1 npx tsx prisma/configureStoreAffiliate.ts` — confirma ANTES/DEPOIS (simulado) sem gravar nada.
3. **Validar a loja/link no dry-run**: conferir que `storeSlug` é a loja certa e que `affiliateBaseUrl` está no formato esperado (`buildAffiliateUrl` aceita querystring pura tipo `tag=suplescore-20`, modelo Amazon, ou wrapper com `{url}`, modelo Awin/Lomadee/Rakuten).
4. **Ativar de verdade**: mesmo comando sem `DRY_RUN` (ou `DRY_RUN=0`) — grava `isAffiliate=true` e `affiliateBaseUrl` só na loja apontada, nenhuma outra linha tocada.
5. **Testar `/go`**: abrir um produto real dessa loja, clicar "Ver oferta", confirmar redirect (302) para a URL final com o parâmetro de afiliado aplicado (ex.: `tag=suplescore-20` na URL da Amazon).
6. **Confirmar `OutboundClick.wasAffiliate=true`**: via `/admin/metrics` (cliques por loja) ou consultando a tabela diretamente — o clique de teste do passo 5 deve aparecer com `wasAffiliate: true` só para essa loja; qualquer loja sem `isAffiliate=true` continua gravando `wasAffiliate: false` (comportamento correto, não bug).

## 9. Smoke test pós-deploy

Roteiro manual, rodar **imediatamente** após cada deploy, contra o
domínio real — nunca contra `localhost`. Detalhe adicional (headers,
rate limit, LGPD) em `docs/DEPLOY_PRIMEIRA_RECEITA.md §5` e
`BETA_OPERACIONAL.md §2`.

1. **Home (`/`)** — responde 200, carrega sem erro visível no console.
2. **`/ofertas`** — responde 200, mostra produtos com preço de pelo menos uma categoria ativa (a página já cobre todas as categorias ativas desde `18d5136`).
3. **Ranking** (`/creatina` ou `/categorias/<slug>`) — responde 200, mostra produtos ordenados, botão "Ver oferta" visível nos produtos com preço.
4. **Página de produto** — abrir um produto real, confirmar `canonical`, OpenGraph e JSON-LD (`Product`) no `<head>` renderizado; preço/loja exibidos batem com o banco.
5. **`/admin/monetizacao`** — pede a `ADMIN_API_KEY`, carrega sem erro, cobertura geral exibida.
6. **`/admin/imagens`** — pede a `ADMIN_API_KEY`, fila carrega sem erro no toast do guardrail.
7. **`/robots.txt`** — responde 200, `Disallow: /api/, /conta/, /admin/, /go/`, lista todos os sitemaps.
8. **`/sitemap.xml`** — responde 200, XML válido, não referencia `rss.xml`, lista os 5 sub-sitemaps.
9. **Clique `/go`** — em um produto com oferta, clicar "Ver oferta": abre em nova aba, a URL antes do redirect é `/go/<slug>?source=...` (nunca um link direto pra loja), destino final é 302 pra loja real. Confirmar em `/admin/metrics` que o clique aparece (total sobe em 1, aparece na tabela "por origem").

Se qualquer passo falhar, **não prosseguir para o próximo** — cada
passo depende dos anteriores terem funcionado de verdade.

---

## 10. Ordem exata de deploy

1. **Pré-voo local** (ver §6): `npm run typecheck && npm run lint && npm test && npm run build` — todos verdes antes de prosseguir.
2. **Configurar env vars de produção** na Vercel (ver §5.1 — as 4 obrigatórias no mínimo; §5.2 conforme decisão de escopo do corte).
3. **Confirmar banco**: `npx prisma migrate status` contra `DATABASE_URL`/`DIRECT_URL` de produção — deve mostrar "up to date"; se houver migration pendente, `npx prisma migrate deploy` uma vez (idempotente).
4. **Deploy do código** (Vercel — build automático via `vercel.json`: `npm install` → `npm run build` → deploy).
5. **Smoke test básico** (§9, itens 1, 7, 8) — confirmar que o site básico está no ar antes de qualquer configuração adicional.
6. **Conectar o Blob Store** (§7, passo 1) — se a decisão do corte for já publicar imagens reais neste momento; senão, pular para o passo 8 e voltar aqui depois (placeholders continuam corretos até lá).
7. **Publicar imagens** (§7, passos 2–6) — só se o passo 6 foi feito.
8. **Ativar afiliados adicionais** (§8) — para cada loja com link/tag já em mãos; pode ser feito em qualquer momento depois do passo 4, não bloqueia o resto do corte.
9. **Smoke test completo** (§9, todos os itens) — confirma o funil de ponta a ponta: SEO, monetização, imagem (se aplicável).
10. **Configurar Search Console/Bing** (opcional, §3) — submeter `sitemap.xml`, verificar propriedade.
11. **Anunciar/abrir tráfego** — só depois de todos os passos acima confirmados; ver `BETA_OPERACIONAL.md §1–2` para o checklist de operação do dia a dia a partir daqui.

---

## 11. Documentos relacionados (fonte de detalhe, não duplicados aqui)

| Documento                                    | Cobre                                                                                                                                                                                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docs/DEPLOY.md`                             | Referência técnica completa de infraestrutura — domínio, Search Console, cron, Sentry                                                                                                                                                                                                |
| `docs/DEPLOY_PRIMEIRA_RECEITA.md`            | Checklist detalhado de imagem + afiliado + smoke test (mesma base usada nas seções 7–9 aqui, com o relatório de lojas prioritárias)                                                                                                                                                  |
| `docs/CHECKLIST_PRODUCAO.md`                 | Checklist específico de SEO técnico/analytics — domínio, Search Console, sitemap, validação de `/go`                                                                                                                                                                                 |
| `docs/AUDITORIA_DADOS_TESTE.md`              | Auditoria completa do vazamento de dado de teste e do guardrail ativo                                                                                                                                                                                                                |
| `docs/GESTAO_AFILIADOS.md` / `AFFILIATES.md` | Estratégia e processo de gestão comercial de programas de afiliado                                                                                                                                                                                                                   |
| `BETA_OPERACIONAL.md`                        | Operação do dia a dia pós-lançamento — rollback, monitoramento, suporte, KPIs (nota: última auditoria completa em `6c87119`; alguns números ali, como contagem de testes, estão desatualizados em relação a este documento — usar este documento para o estado técnico mais recente) |

---

_Este documento reflete o estado real confirmado em auditoria até `58c3ced` (2026-09-16), com §1/§2/§3/§7 atualizadas em 2026-09-16 após a conclusão da frente de imagens em produção (`BLOB_READ_WRITE_TOKEN` resolvido, 20 imagens publicadas). Atualizar sempre que um insumo externo listado na §3 for resolvido (marcar como pronto em vez de pendente) ou que uma nova auditoria técnica mude o estado da §1._
