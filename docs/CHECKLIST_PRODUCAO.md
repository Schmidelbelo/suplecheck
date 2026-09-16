# Checklist de Produção — SEO Técnico, Analytics e Medição de Conversão

Gerado em 2026-09-15. Cobre o que falta, do lado de infraestrutura/medição,
entre o estado atual (monetização honesta, SEO técnico corrigido nesta
tarefa) e o primeiro dia em produção com tráfego orgânico real sendo
medido. Nenhum item aqui depende de link de afiliado real ou de
`BLOB_READ_WRITE_TOKEN` — ambos continuam documentados como pendências
externas separadas (`docs/DEPLOY_PRIMEIRA_RECEITA.md`,
`docs/AUDITORIA_AFILIADOS.md`).

---

## 1. Conectar o domínio

- [ ] Apontar o domínio de produção pro deploy da Vercel.
- [ ] Confirmar `NEXT_PUBLIC_SITE_URL` (ou equivalente lido por
      `src/config/site.ts`) aponta pro domínio real, não `localhost`/preview
      — todo o SEO técnico (`sitemap`, `robots`, `canonical`, JSON-LD) usa
      `siteConfig.url` como base.
- [ ] Confirmar o redirect `www.` → apex (ou o inverso, o que for o
      canônico) está ativo (`next.config.ts`, já configurado — só validar
      que o domínio real bate com a regra).

## 2. Search Console

- [ ] Cadastrar a propriedade (domínio ou prefixo de URL) no Google
      Search Console.
- [ ] Verificar propriedade — `src/app/layout.tsx` já lê uma variável de
      verificação (confirmar o nome exato da env var e preenchê-la, ou usar
      verificação por DNS/HTML direto no domínio).
- [ ] Repetir o cadastro no Bing Webmaster Tools (opcional, mas rápido —
      mesma sitemap serve pros dois).

## 3. Enviar sitemap

- [ ] No Search Console, submeter `https://<domínio>/sitemap.xml` (o
      índice — não precisa submeter os sub-sitemaps individualmente, o
      índice já aponta pra todos).
- [ ] Confirmar que o índice carrega sem erro e lista `sitemap-static.xml`,
      `sitemap-produtos.xml`, `sitemap-marcas.xml`, `sitemap-categorias.xml`,
      `sitemap-comparacoes.xml` (não deve mais listar `rss.xml` — isso foi
      corrigido nesta tarefa: `rss.xml` não é um sitemap XML válido, não
      pertence dentro de `<sitemapindex>`; ele continua anunciado
      separadamente em `robots.txt`).
- [ ] Abrir cada sub-sitemap manualmente uma vez e conferir que as URLs
      batem com produção (não com preview/staging).

## 4. Configurar Analytics via env

- [ ] `NEXT_PUBLIC_GA_ID` (Google Analytics) e/ou `NEXT_PUBLIC_CLARITY_ID`
      (Microsoft Clarity) — `src/modules/analytics/components/AnalyticsScripts.tsx`
      já lê essas env vars e não quebra se estiverem ausentes (retorna
      `null`, nenhum script fantasma), então é seguro configurar uma, as
      duas, ou nenhuma sem risco técnico — mas sem nenhuma, não há como
      medir aquisição orgânica no funil (só o volume de `OutboundClick`,
      que já funciona independente de analytics de terceiro).
- [ ] Confirmar que o consentimento de cookies (LGPD) está sendo
      respeitado em produção — `AnalyticsScripts` só renderiza os scripts
      depois de consentimento real, nunca antes.

## 5. Validar robots/sitemap em produção

- [ ] `https://<domínio>/robots.txt` carrega e mostra:
      `disallow: /api/, /conta/, /admin/, /go/` (o `/go/` foi adicionado
      nesta tarefa — antes não estava bloqueado, gastando orçamento de
      rastreamento à toa num Route Handler que só redireciona).
  - Depois de recuperar o output de `/robots.txt` (não pelo código, pela URL real).
- [ ] Confirmar que nenhuma página de `/admin/*` aparece indexada
      (`site:<domínio>/admin` no Google, ou aguardar o relatório de
      cobertura do Search Console) — todas as 5 páginas admin já têm
      `noIndex: true` (confirmado nesta auditoria, nenhuma mudança
      necessária).
- [ ] Confirmar visualmente 2–3 páginas de produto/categoria reais têm
      `<link rel="canonical">` correto (ver código-fonte da página) e
      `robots: index, follow` no `<head>`.

## 6. Validar 3 cliques `/go` em produção

Roteiro mínimo pra confirmar que o funil de medição está de ponta a ponta
antes de anunciar/promover o site:

1. Abrir uma página com produto monetizado (ex.: um dos 15 produtos
   Amazon — ver `/admin/monetizacao` pra lista atual) e clicar "Ver
   oferta". Confirmar que abre em nova aba e a URL final é da loja real
   (com `tag=suplescore-20` pra Amazon).
2. Repetir em outro componente — ex.: um card de "Ofertas" (`/ofertas`)
   e um card de "Alternativa" na página de produto — pra cobrir mais de
   uma `source`.
3. Abrir `/admin/metrics` (com a `ADMIN_API_KEY`) e confirmar que
   "Cliques totais" subiu em 3 e que a tabela "Cliques por origem
   (source)" (nova nesta tarefa) mostra as origens usadas no passo 2 —
   confirma que `OutboundClick` está gravando em produção de verdade, não
   só localmente.

Se qualquer um desses 3 passos falhar, não prosseguir com aquisição de
tráfego — o funil de medição precisa estar confirmado antes de trazer
visitante real.

## 7. O que já está pronto (nenhuma ação necessária)

- SEO técnico auditado e corrigido nesta tarefa: `robots.txt` bloqueia
  `/go/`; `sitemap.xml` (índice) e `sitemap-static.xml` ganharam
  `revalidate`; `rss.xml` removido do índice de sitemaps (formato
  inválido ali); JSON-LD `Product.offers.availability` deixou de
  hardcodar `InStock` e agora usa `PriceEntry.availability` real (omite o
  campo quando o valor é `UNKNOWN`, nunca inventa).
- Todas as 5 páginas `/admin/*` já tinham `noIndex: true` — confirmado,
  nenhuma mudança necessária.
- `/go/[productId]` é um Route Handler puro (sem `page.tsx`), não gera
  HTML indexável de qualquer forma — o bloqueio em `robots.txt` é reforço
  de higiene de rastreamento, não correção de um vazamento real.
- Relatório de cliques (`/admin/metrics`) já existia com total, por loja,
  por produto, por categoria, afiliado vs. direto e produtos sem clique —
  nesta tarefa ganhou **cliques por origem (source)** e o filtro de
  "produtos sem clique" passou a exigir que o produto tenha oferta real
  (preço capturado), não só estar publicado — evita sugerir falsamente
  que um produto sem nenhum preço é uma "oportunidade perdida" de clique.
- `AnalyticsScripts` já é seguro sem env var (retorna `null`).

## 8. Garantias desta tarefa

- Nenhum dado, review, `aggregateRating`, disponibilidade ou preço
  inventado — a correção de `offers.availability` foi remover um valor
  fixo (`InStock` sempre) e substituir por dado real já capturado em
  `PriceEntry.availability`.
- Nenhum `affiliateBaseUrl` ou dado comercial alterado.
- Nenhuma imagem publicada.
- Nenhuma página vazia criada só por SEO — todas as mudanças foram em
  infraestrutura (`robots`, `sitemap`, JSON-LD) e em relatório
  administrativo já existente (`/admin/metrics`).
