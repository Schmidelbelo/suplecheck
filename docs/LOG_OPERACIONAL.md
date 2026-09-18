# Log Operacional

Registro curto de continuidade do projeto. Atualizar no fim do dia ou ao encerrar uma frente importante.

## 2026-09-18

### Fechamento — Nutrata despublicada, filtro de status no ranking, deploy e reprocessamento

Continuação direta do achado de 2026-09-17 (Nutrata despublicada mas
ainda visível em `/ofertas`/`/creatina`). Frente fechada nesta data com
todas as pontas resolvidas.

**O que foi feito, em ordem:**

1. Investigação read-only revelou a causa real: `/ofertas`/`/creatina`
   leem um snapshot pré-computado de `Ranking`, e nenhum ponto do
   pipeline (`listLatestByCategory`, `loadPresentations`) filtrava
   `Product.status` — por isso um produto despublicado, com
   `ProductScore` antiga ainda válida, continuava aparecendo. Registrado
   em `docs/PENDENCIA_RANKING_FILTRO_STATUS.md`.
2. Corrigido no código (commit `4e930fa`): filtro `status: "PUBLISHED"`
   adicionado em `PrismaIndexResultRepository.listLatestByCategory`
   (geração do ranking) e em `productViewService.loadPresentations`
   (rede de segurança na leitura pública — ranking, mercado,
   recomendação). `RankingMapper`/`RankingApplicationService` não
   precisaram mudar. Testes novos/ajustados cobrindo o caso,
   `typecheck` limpo, 201/201 testes passando.
3. **Deploy em produção**: a partir de um `git worktree` limpo no
   commit `4e930fa` (nunca a partir da working tree principal, que tem
   `affiliate-discovery` não commitado) — `vercel --prod`. 4 tentativas
   por instabilidade de rede transitória (mesmo padrão de flakiness já
   visto com o Neon nesta sessão); a build final ficou `● Ready`, aliada
   a `suplescore.com.br`.
4. **Reprocessamento**: `POST /api/evaluation/rankings/creatina` —
   snapshot novo com 10 entradas (antes 11); `nutrata-creatina-creapure-250g`
   fora da lista.

**Estado final confirmado:**

- Produção está no commit `4e930fa`.
- Ranking de `creatina` foi reprocessado após o deploy.
- `nutrata-creatina-creapure-250g` continua `UNPUBLISHED` e não aparece
  mais em `/creatina` nem `/ofertas`.
- As 5 URLs Amazon corrigidas (`max-titanium-creatina-300g`,
  `atlhetica-creatina-300g`, `optimum-nutrition-creatine-300g`,
  `growth-creatina-monohidratada-300g`, `black-skull-creatina-300g`)
  continuam redirecionando via `/go` para a página de produto
  específica com `tag=suplescore-20` — nenhuma caiu em URL de busca.
- Mercado Livre (Growth Óleo de Peixe Ultra 75 Cápsulas) continua
  redirecionando via `/go` para `https://meli.la/2jWrJqm`.
- Tracking validado em 6/6 cliques (5 Amazon + 1 Mercado Livre), todos
  com `OutboundClick.wasAffiliate: true` e `storeId` consistente, sem
  duplicação de produto/oferta.
- Nesta operação final (deploy + reprocessamento + validação), nenhum
  código, schema, migration, imagem ou afiliado foi alterado — só
  ações operacionais (deploy do que já estava commitado/pushado +
  chamada HTTP de reprocessamento + leitura de validação).
- `affiliate-discovery` seguiu intocado durante toda a frente.

Frente encerrada. Próximos itens conhecidos e ainda pendentes (não
retomados agora): decisão humana sobre `nutrata-creatina-creapure-250g`
(recapturar com peso confirmado ou manter despublicado
permanentemente), ambiguidade de sabor do candidato Mercado Livre "Max
Titanium Mass Titanium 17500 3kg", recaptura do Integralmédica Sinister
Mass 3kg, e os 3 offers de `loja-oficial`/`netshoes` com URL
possivelmente mal atribuída — nenhum desses foi tocado hoje.

## 2026-09-17

### Atualização de contexto — Netshoes/Rakuten (antes de qualquer trabalho novo)

O suporte da Rakuten Advertising respondeu: a conta foi **rejeitada
permanentemente** pelo anunciante Netshoes. Isso explica o "painel com
problema de interação" registrado no log de 2026-09-16 (item 23) — não
era um bug de UI, era a rejeição em si impedindo qualquer clique/ação
no painel.

Efeito prático:

- Netshoes deixa de ser tratado como "aguardando suporte" ou "campanha
  aparentemente ativa" — é **afiliado indisponível por decisão do
  anunciante**, não uma pendência técnica temporária.
- **Não configurar** `affiliateBaseUrl` para Netshoes.
- **Não insistir** no painel Rakuten/Netshoes — não há mais nada a
  destravar ali.
- Produto(s) apontando para a loja Netshoes no catálogo: tratar como
  loja sem monetização afiliada por enquanto, ou trocar futuramente por
  outra loja com afiliado válido — decisão comercial, não técnica.
- `docs/READINESS_PRODUCAO_BETA.md` §1/§3.1/§4.2 atualizados com esse
  status corrigido.

Nenhum código, banco, afiliado (além desta correção documental de
status), imagem ou env var foi alterado para registrar isto.

### Frente visual `/ofertas` — 1 de 3 placeholders resolvido

Trabalho item a item nos 3 placeholders mais visíveis em `/ofertas`
(sem lote automático, sem afiliados/Nutrata/slugs tocados — ver
`docs/AUDITORIA_COBERTURA_IMAGENS.md §8` para o relatório completo):

- **`neo-quimica-melatonina-021mg-90-comprimidos`**: ✅ resolvido. Fonte
  já registrada no catálogo (Amazon) validada — marca, sabor (maracujá)
  e quantidade (90) confirmados na página, imagem inspecionada
  visualmente antes de publicar. Publicado via
  `POST /api/admin/images/upload`. Fila `PendingImage`: 18 → 17.
- **`growth-coenzima-q10-100mg-60-capsulas`**: continua `PENDING`. 5
  fontes tentadas, todas bloqueadas (anti-bot/DNS/403) — reconfirma a
  causa já registrada, nenhum candidato inventado.
- **`probiotica-epic-pre-treino-300g`**: continua `PENDING`. Causa nova
  identificada: produto vendido em pelo menos 5 sabores distintos, cada
  um com foto própria, e o catálogo não especifica qual sabor este SKU
  representa — mesma categoria de ambiguidade do caso Nutrata, não
  resolvido por aproximação.

`/ofertas` validado 200 depois da mudança. Nenhum afiliado, banco (além
do `ProductImage`/`PendingImage` deste item), código ou slug alterado.

### Segunda rodada — mais 2 placeholders resolvidos após correção de catálogo

Com Growth e Atlhetica já com nome certo no catálogo (§ acima), esses
dois deixaram de ser "erro de catálogo" e viraram pesquisáveis. Fonte
forte encontrada e validada visualmente pra ambos antes de publicar
(ver `docs/AUDITORIA_COBERTURA_IMAGENS.md §9` para o relatório
completo):

- **`growth-creatina-monohidratada-300g`**: ✅ resolvido (fonte:
  xtrategynutrition.com). Fila: 17 → 16.
- **`atlhetica-creatina-300g`**: ✅ resolvido (fonte:
  curitibasuplementos.com.br — Amazon bloqueou com captcha, site
  oficial da marca tinha `og:image` quebrado, ambos descartados). Fila:
  16 → 15.

**Total do dia**: 3 imagens publicadas, fila `PendingImage` 18 → 15.
Limite seguro do dia atingido — os 3 restantes
(`growth-coenzima-q10-100mg-60-capsulas`, `probiotica-epic-pre-treino-300g`,
`nutrata-creatina-creapure-250g`) têm causa real documentada (fonte
bloqueada, ambiguidade de sabor, ambiguidade de SKU) que não se resolve
insistindo hoje. `/ofertas` responde 200. Nenhum afiliado, Mercado
Livre, Netshoes, Nutrata, slug ou `affiliate-discovery` tocado; nenhum
lote automático.

### Frente de imagens encerrada por hoje — auditoria rápida da experiência pública

Com a frente de imagens encerrada por hoje, rodada uma auditoria rápida
só de leitura (HTTP), sem alterar código/banco/afiliados/imagens, para
procurar problema visual/SEO/link quebrado óbvio antes de fechar o dia.

**Páginas verificadas**: `/`, `/ofertas`, `/creatina`, 3 produtos com
imagem real (Vitafor, Growth, Atlhetica) e 1 produto ainda com
placeholder (Nutrata).

**Verificado e correto**:

- Todas as páginas principais respondem 200.
- 22 links de navegação/rodapé da home e os links de produto amostrados
  em `/ofertas`/`/creatina` respondem 200 — nenhum link quebrado.
- Nenhuma imagem quebrada — todas as URLs de imagem (Blob e local)
  carregam 200.
- SEO básico presente e coerente em todas as páginas checadas: title,
  meta description, canonical, um único `h1`, JSON-LD `Product` +
  `BreadcrumbList`.
- `robots.txt` e `sitemap.xml` respondem 200.
- Nenhum texto quebrado visível ao usuário (`undefined`, `NaN`,
  `R$0,00`) — únicas ocorrências encontradas são artefatos internos do
  bundle React/Next, não visíveis na página renderizada.
- Cards com placeholder em `/ofertas` batem exatamente com os 3 itens
  já documentados como pendentes — nenhum novo placeholder inesperado.

**Nenhum problema objetivo encontrado.**

**Frente de imagens encerrada por hoje.** Seguem pendentes, sem
insistência:

- `growth-coenzima-q10-100mg-60-capsulas` — fonte bloqueada.
- `probiotica-epic-pre-treino-300g` — ambiguidade de sabor.
- `nutrata-creatina-creapure-250g` — ambiguidade de SKU/peso; não
  seguir a menos que apareça fonte forte nova que confirme o SKU exato
  e explique o preço já capturado.

**Amazon fica para checar amanhã**, aguardando revisão fiscal.

Nenhum código, banco, afiliado ou imagem alterado para esta auditoria;
`affiliate-discovery` não tocado.

### Afiliado por oferta (Mercado Livre) — schema, código e primeiro teste real em produção

Executado o plano de `docs/DESENHO_AFILIADO_POR_OFERTA.md` em 4 etapas
pequenas e sequenciais, cada uma com commit próprio, typecheck e testes
antes de avançar:

1. **Schema/migration** — `PriceEntry.affiliateUrl` (nullable) adicionado
   ao schema; migration `20260917124803_add_price_entry_affiliate_url`
   gerada via diff puro (sem tocar banco nesse momento).
2. **Tipos/validação** — `recordPriceSchema` ganhou `affiliateUrl`
   opcional, validado como URL.
3. **API/admin** — `price.service.ts` (`recordPrice`) passa a persistir
   o campo; a rota `POST /api/catalog/skus/[id]/prices` já era genérica,
   sem mudança própria.
4. **Consumo no `/go`** — `outboundClick.service.ts`: quando
   `PriceEntry.affiliateUrl` está preenchido, tem precedência total como
   destino final do redirect, ignorando `Store.affiliateBaseUrl` só
   naquela captura; ausente, comportamento idêntico ao anterior. Novo
   teste em `test/api/go.api.test.ts` cobrindo o caso.

Migration aplicada primeiro em dev, depois em produção (mesmo host Neon
nos dois `.env`, confirmado) — 83 registros existentes confirmados com
`affiliateUrl = NULL` antes de qualquer preenchimento real.

**Teste real de 1 oferta em produção** — validação ponta a ponta do
fluxo completo, sem lote:

- **Produto**: Growth Supplements Óleo de Peixe Ultra 75 Cápsulas
  (`growth-oleo-de-peixe-ultra-75-capsulas`).
- **Loja**: `mercado-livre` (`Store.affiliateBaseUrl` **não alterado**
  — segue `null`, `isAffiliate: false`; a precedência do
  `PriceEntry.affiliateUrl` funciona independente disso).
- **Link usado**: `https://meli.la/2jWrJqm` — deeplink oficial gerado
  no painel de afiliados do Mercado Livre, na página exata deste
  produto (`mercadolivre.com.br/.../p/MLB20559531`). Um link antigo/
  genérico de teste (`meli.la/16T3cTu`, de uma validação anterior sem
  produto atrelado) foi colado por engano no meio da tarefa e
  **descartado antes de qualquer escrita** — não usado.
- **`PriceEntry` criado**: `cmu5pkln80001jy043cjkt67c`, via
  `POST /api/catalog/skus/[id]/prices` (API já existente, protegida por
  `ADMIN_API_KEY`) — mesmo preço/URL já capturados antes, só
  acrescentando `affiliateUrl`.
- **`/go` validado**: `GET /go/growth-oleo-de-peixe-ultra-75-capsulas`
  redireciona (302) exatamente para `https://meli.la/2jWrJqm`.
- **Tracking validado**: novo `OutboundClick` gravado com
  `wasAffiliate: true`; o clique histórico do mesmo produto de
  2026-09-12 (antes da mudança) permanece `wasAffiliate: false` —
  histórico não reescrito, comportamento append-only preservado.
- **Único registro afetado**: confirmado **1 de 84** `PriceEntry` no
  banco inteiro com `affiliateUrl` preenchido — só este.
- **Demais produtos sem `affiliateUrl`**: comportamento antigo
  confirmado intacto — outro produto da mesma loja `mercado-livre`
  (Max Titanium Mass Titanium 17500 3kg, sem `affiliateUrl`) continua
  redirecionando pra URL direta, exatamente como antes.
- **Visibilidade preservada**: página do produto responde 200, produto
  continua listado em `/categorias/omega-3`, `/ofertas` responde 200.

Nenhum código alterado para rodar este teste (só chamadas HTTP contra a
API administrativa já existente). Nenhum outro `affiliateUrl`
preenchido. Amazon, Netshoes, Nutrata, imagens e `affiliate-discovery`
não tocados.

### Procedimento operacional + validação do próximo candidato Mercado Livre

Criado `docs/PROCEDIMENTO_AFILIADO_MERCADO_LIVRE.md` — passo a passo
repetível pra configurar novas ofertas. Levantamento contra produção
achou só 2 candidatos com `PriceEntry.url` do Mercado Livre já
capturada (além do que já foi configurado).

Validação manual do candidato 1 (Integralmédica Sinister Mass 3kg):
a URL capturada **não abre mais como anúncio válido** — "Parece que
esta página não existe" no navegador real. **Descartado** — a captura
de preço desta oferta está desatualizada (problema de dado de preço,
não de afiliado), não configurar `affiliateUrl` até recapturar contra
um anúncio ativo.

Único candidato restante: Max Titanium Mass Titanium 17500 3kg — ainda
com ambiguidade de sabor não resolvida (URL capturada é "sabor
morango", catálogo não especifica sabor). Não configurado.

Nenhum `affiliateUrl` preenchido, nenhum código/banco alterado.

## 2026-09-16

### Resumo do dia

Dia focado em deixar o beta mais perto de gerar receita sem esconder lacunas reais. A frente de imagens foi estabilizada em producao, afiliados principais foram validados/documentados, Amazon teve fiscal enviado, Mercado Livre teve o formato real de link afiliado identificado como `meli.la` por produto, e a cobertura visual de `/ofertas` foi auditada. Tambem foram corrigidos dois erros pontuais de catalogo que impediam busca correta de imagem.

### Concluido

- Vercel/credenciais: `ADMIN_API_KEY` de producao corrigida, redeploy feito, `/api/admin/images/pending` e `/api/admin/metrics` validados com 200.
- Imagens: 20 candidatos aprovados publicados no Vercel Blob em producao, com 0 falhas; 18 itens sem candidato preservados como `PENDING`.
- Documentacao de imagens: `docs/READINESS_PRODUCAO_BETA.md` atualizado e `docs/AUDITORIA_COBERTURA_IMAGENS.md` criado/atualizado.
- Cobertura visual: auditoria confirmou 60 produtos publicados, 43 com foto real e 17 placeholders visiveis; `/ofertas` tem 21 produtos distintos, 6 com placeholder (~29%).
- Catalogo: corrigidos em producao, via API administrativa existente, os nomes:
  - `growth-creatina-monohidratada-300g`: `Creatina Monohidratada 300g` -> `Creatina Monohidratada 250g`.
  - `atlhetica-creatina-300g`: `Creatina Nitro 300g` -> `Creatina 100% Pure 300g`.
- Nutrata: `nutrata-creatina-creapure-250g` mantido pendente por ambiguidade real de SKU/preco.
- Amazon: portal ativo com StoreID/tag `suplescore-20`; redirect `/go` confirmado com `tag=suplescore-20`; questionario fiscal preenchido/enviado, tela da conta mostra `Enviado`, questionario mostrou `Completo` e retencao `0.0%`.
- Mercado Livre: conta ativa no painel; cliques registrados no SupleScore; formato oficial copiado do painel e documentado como link curto/deeplink por produto (`meli.la`) mais ID de busca, incompatível com `affiliateBaseUrl` global.
- Netshoes/Rakuten: campanha principal parece listada/ativa, mas painel com problema de interacao; suporte acionado pelo usuario.
- Commits/documentos relevantes enviados para `origin/main`: `0881c9e`, `586bc98`, `92a6b8a`, `ea1a01c`, `136424d` e documentacoes relacionadas.

### Validado Em Producao

- `https://suplescore.com.br` responde 200.
- `/ofertas` responde 200 apos publicacao de imagens e apos correcoes de catalogo.
- `/api/admin/images/pending` responde 200 com `ADMIN_API_KEY`.
- `/api/admin/metrics` responde 200 com `ADMIN_API_KEY`.
- `/admin/imagens` responde 200.
- `/robots.txt` e `/sitemap.xml` respondem 200.
- Ranking/paginas de produto mostram imagens reais do Vercel Blob onde ja existem.
- Amazon `/go` redireciona com `tag=suplescore-20`.
- Metricas registram cliques por loja, incluindo Amazon, Mercado Livre e Netshoes.
- Paginas dos produtos corrigidos renderizam os nomes novos, mantendo os slugs antigos.

### Pendente Real

- Imagens: resolver manualmente os 3 placeholders mais visiveis em `/ofertas`:
  - `probiotica-epic-pre-treino-300g` (fonte bloqueada).
  - `growth-coenzima-q10-100mg-60-capsulas` (fonte sem metadata).
  - `neo-quimica-melatonina-021mg-90-comprimidos` (fonte generica).
- Nutrata: manter `nutrata-creatina-creapure-250g` pendente ate haver fonte forte para decidir entre 150g/300g ou corrigir a origem do preco.
- `PendingImage.reason`: Growth e Atlhetica ainda podem ter texto antigo na fila porque nao existe endpoint administrativo para atualizar esse campo; tratar como follow-up pequeno, nao bloqueador.
- Mercado Livre: investigar se existe ferramenta oficial para gerar link afiliado a partir de URL arbitraria. Se nao existir, desenhar suporte por oferta, por exemplo `PriceEntry.affiliateUrl`; nao usar `affiliateBaseUrl` global.
- Netshoes/Rakuten: aguardar suporte resolver o painel antes de tentar obter link/publisher ID.
- Amazon: aguardar revisao fiscal da Amazon por 3 a 5 dias uteis; conferir se o status permanece aprovado/enviado e sem novo aviso.
- Trabalho paralelo de `affiliate-discovery` segue no working tree e deve ser tratado como frente separada.

### Nao Mexer

- Nao publicar imagens sem fonte real confirmada.
- Nao aceitar candidato de produto, sabor, peso ou marca diferente.
- Nao resolver Nutrata por aproximacao.
- Nao inventar `affiliateBaseUrl`.
- Nao configurar Mercado Livre como querystring/wrapper global.
- Nao mexer em afiliados durante tarefas de imagem.
- Nao alterar slugs dos produtos corrigidos sem uma decisao explicita de SEO/redirect.
- Nao tocar no trabalho paralelo de `affiliate-discovery` ao commitar logs/docs do dia.

### Proximo Passo Recomendado Para Amanha

Comecar pela frente visual de `/ofertas`, mas com escopo pequeno: resolver manualmente os 3 placeholders mais visiveis que ja nao sao erro de catalogo. O objetivo e encontrar fonte real, criar candidato confiavel e publicar no maximo depois de validacao item a item. Se a fonte nao for forte, manter `PENDING`.

Depois disso, voltar para monetizacao:

- Amazon: apenas conferir status fiscal.
- Mercado Livre: decidir arquitetura para link afiliado por oferta.
- Netshoes/Rakuten: aguardar retorno do suporte.

### Ordem Para Claude Retomar

```text
Retome pelo log operacional de 2026-09-16 em docs/LOG_OPERACIONAL.md.

Foco de agora: resolver visualmente /ofertas sem abrir frente grande.

Tarefa:
1. Trabalhar somente nos 3 placeholders mais visiveis em /ofertas:
   - probiotica-epic-pre-treino-300g
   - growth-coenzima-q10-100mg-60-capsulas
   - neo-quimica-melatonina-021mg-90-comprimidos
2. Para cada produto, pesquisar fonte real e especifica do produto exato.
3. Nao aceitar imagem de produto, sabor, peso ou marca diferente.
4. Se encontrar fonte confiavel, preparar candidato e reportar antes de publicar.
5. Publicar somente se houver validacao clara de produto exato.
6. Se nao encontrar fonte forte, manter PENDING e documentar a causa.

Proibido nesta retomada:
- nao mexer em afiliados;
- nao alterar affiliateBaseUrl;
- nao configurar Mercado Livre;
- nao alterar Nutrata;
- nao alterar slugs;
- nao tocar no trabalho paralelo de affiliate-discovery;
- nao publicar lote automatico.

Criterio de aceite:
- /ofertas continua 200;
- nenhuma imagem errada publicada;
- os 3 itens ficam resolvidos com foto real ou documentados honestamente como ainda pendentes;
- qualquer alteracao de banco/imagem e reportada com antes/depois.
```
