# Log Operacional

Registro curto de continuidade do projeto. Atualizar no fim do dia ou ao encerrar uma frente importante.

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
