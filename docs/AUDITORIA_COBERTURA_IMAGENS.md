# Auditoria de Cobertura de Imagens Reais — Produção

Gerada em 2026-09-16, contra produção (`https://suplescore.com.br`). Motivada
por observação direta: `/ofertas` ainda mostra muitos produtos sem foto
real, apesar da publicação anterior (`0881c9e`) ter colocado 20 imagens
aprovadas no Vercel Blob.

**Esta auditoria é só leitura.** Nenhuma imagem foi publicada, nenhum
`PendingImage` foi criado ou alterado, nenhum código ou dado no banco foi
tocado. Todos os números abaixo vieram de requisições HTTP reais contra
produção (`sitemap-produtos.xml`, páginas de produto, `/ofertas`,
`GET /api/admin/images/pending` com `ADMIN_API_KEY`) — nenhum estimado.

Metodologia: a regra de "foto real" usada é a mesma já codificada em
`isRealCoverUrl()` (`src/modules/media/services/productImage.service.ts`)
— uma URL de capa só conta como real quando **não contém** `card` nem
`placeholder`, independente de estar hospedada no Vercel Blob ou em
`/public/products` (alguns produtos têm foto real legada, pré-migração
para Blob, hospedada localmente). Para cada um dos 60 produtos publicados
listados em `sitemap-produtos.xml`, a imagem de capa considerada foi a
primeira `<img>` "hero" (`data-nimg="fill"`) da página de produto.

---

## 1. Cobertura geral (60 produtos publicados)

| Métrica                                                     | Total  |
| ----------------------------------------------------------- | ------ |
| Produtos publicados                                         | 60     |
| Com foto real                                               | **43** |
| Com placeholder/card ilustrativo                            | **17** |
| Placeholders já na fila `PendingImage`                      | **17** |
| Placeholders fora da fila (gap não capturado pelo pipeline) | **0**  |

Nenhum produto com placeholder ficou fora da fila de imagens. Os 17
placeholders encontrados batem exatamente com 17 dos 18 registros
`PendingImage` (todos `status: PENDING`, todos sem `candidateUrl`). O 18º
registro da fila é órfão: `Produto Price Stats`, um fixture de teste já
arquivado (`ARCHIVED`, ver `docs/AUDITORIA_DADOS_TESTE.md`) — não aparece
mais no sitemap público, mas o guardrail de imagem ainda mantém a linha
na fila. Limpeza cosmética, sem urgência, sem impacto visual.

## 2. Cobertura por categoria

| Categoria          | Total | Real | Placeholder | Placeholders                                                                                      |
| ------------------ | ----- | ---- | ----------- | ------------------------------------------------------------------------------------------------- |
| whey-protein       | 16    | 14   | 2           | `soldiers-nutrition-whey-protein-concentrado-1kg`, `probiotica-hiper-100-whey-900g`               |
| creatina           | 11    | 8    | 3           | `nutrata-creatina-creapure-250g`, `atlhetica-creatina-300g`, `growth-creatina-monohidratada-300g` |
| pre-treino         | 6     | 4    | 2           | `probiotica-epic-pre-treino-300g`, `darkness-evora-pw-limao-150g`                                 |
| cafeina            | 4     | 2    | 2           | `growth-cafeina-200mg-60-capsulas`, `growth-cafeina-100mg-120-capsulas`                           |
| omega-3            | 4     | 4    | 0           | —                                                                                                 |
| colageno           | 3     | 2    | 1           | `probiotica-pro-collagen-330g`                                                                    |
| pasta-de-amendoim  | 2     | 1    | 1           | `growth-pasta-de-amendoim-integral-torrado-1kg`                                                   |
| barras-de-proteina | 2     | 2    | 0           | —                                                                                                 |
| hipercalóricos     | 2     | 2    | 0           | —                                                                                                 |
| coenzima-q10       | 2     | 0    | 2           | `growth-coenzima-q10-100mg-60-capsulas`, `integralmedica-coq10-30-capsulas`                       |
| glutamina          | 2     | 2    | 0           | —                                                                                                 |
| bcaa               | 2     | 2    | 0           | —                                                                                                 |
| zma                | 2     | 0    | 2           | `max-titanium-zma-90-capsulas`, `growth-zma-ultra-120-comprimidos`                                |
| melatonina         | 2     | 0    | 2           | `neo-quimica-melatonina-021mg-90-comprimidos`, `growth-melatonina-021mg-100-capsulas`             |

### 2.1 Categorias 100% sem foto real

Três categorias têm **todas** as unidades publicadas com placeholder —
pequenas em volume (2 produtos cada), mas visualmente zeradas:

- **coenzima-q10** (2/2 com placeholder)
- **zma** (2/2 com placeholder)
- **melatonina** (2/2 com placeholder)

## 3. Os 18 `PendingImage` por causa

| Causa                                                                                                      | Qtde | Produtos                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fonte bloqueada** (timeout, bloqueio do site ou erro de rede na captura)                                 | 7    | `probiotica-epic-pre-treino-300g`, `growth-cafeina-200mg-60-capsulas`, `growth-coenzima-q10-100mg-60-capsulas`, `max-titanium-zma-90-capsulas`, `growth-melatonina-021mg-100-capsulas`, `growth-cafeina-100mg-120-capsulas`, `probiotica-hiper-100-whey-900g`  |
| **Fonte genérica** (a fonte registrada é uma home/listagem, não a página de um produto específico)         | 3    | `neo-quimica-melatonina-021mg-90-comprimidos`, `growth-pasta-de-amendoim-integral-torrado-1kg`, `soldiers-nutrition-whey-protein-concentrado-1kg`                                                                                                              |
| **Fonte sem metadata** (página carregou, mas não expõe `og:image`, `twitter:image` nem JSON-LD `Product`)  | 3    | `probiotica-pro-collagen-330g`, `integralmedica-coq10-30-capsulas`, `growth-zma-ultra-120-comprimidos`                                                                                                                                                         |
| **Erro de catálogo** (nome/peso que a marca não vende de verdade — nenhuma foto pública pode corresponder) | 3    | `nutrata-creatina-creapure-250g` (Nutrata só vende Creapure em 150g/300g — 250g não existe), `atlhetica-creatina-300g` (linha "Nitro" não existe na Atlhetica), `growth-creatina-monohidratada-300g` (Growth só vende creatina em 100g/250g — 300g não existe) |
| **Fonte retornou produto/sabor errado** (duas tentativas rejeitadas por não corresponder ao produto exato) | 1    | `darkness-evora-pw-limao-150g` — drogaraia.com.br devolveu o sabor uva (não limão); emporioquatroestrelas.com.br devolveu a foto de outro produto (Black Skull BOPE) por erro na própria página do revendedor                                                  |
| **Produto de teste/fixture** (órfão na fila, produto já arquivado)                                         | 1    | `Produto Price Stats`                                                                                                                                                                                                                                          |

**Total: 18** — bate exatamente com a contagem confirmada em produção.

Os 3 casos de **erro de catálogo** são os únicos que bloqueiam qualquer
busca de imagem: enquanto o peso/nome do produto no banco não corresponder
a algo que a marca realmente vende, nenhuma pesquisa de foto (manual ou
automática) pode ter sucesso — não é um problema de fonte de imagem, é um
problema de dado de catálogo anterior à imagem.

## 4. Impacto real em `/ofertas`

`/ofertas` é a página com maior visibilidade do problema, por ser onde o
usuário comparou preços entre categorias diferentes na mesma tela.

| Métrica                                            | Valor    |
| -------------------------------------------------- | -------- |
| Produtos distintos listados em `/ofertas` hoje     | **21**   |
| Desses, com placeholder                            | **6**    |
| Proporção do que é visível na página sem foto real | **~29%** |

### 4.1 Lista priorizada — os 6 placeholders visíveis em `/ofertas`

Ordem de prioridade: primeiro os que bloqueiam por erro de catálogo
(porque são pré-requisito para qualquer outra ação), depois os demais por
ordem de aparição:

1. **`growth-creatina-monohidratada-300g`** — erro de catálogo (peso 300g não existe na Growth)
2. **`atlhetica-creatina-300g`** — erro de catálogo (linha "Nitro" não existe na Atlhetica)
3. **`nutrata-creatina-creapure-250g`** — erro de catálogo (peso 250g não existe na Nutrata)
4. **`probiotica-epic-pre-treino-300g`** — fonte bloqueada, exige pesquisa manual de fonte nova
5. **`growth-coenzima-q10-100mg-60-capsulas`** — fonte sem metadata, exige pesquisa manual de fonte nova
6. **`neo-quimica-melatonina-021mg-90-comprimidos`** — fonte genérica, exige pesquisa manual de fonte nova

## 5. Recomendação — próximos passos, nesta ordem

1. **Corrigir os 3 erros de catálogo primeiro** (`growth-creatina-monohidratada-300g`, `atlhetica-creatina-300g`, `nutrata-creatina-creapure-250g`) — sem corrigir nome/peso no catálogo, não existe imagem correta possível de encontrar; qualquer busca de foto antes dessa correção seria trabalho perdido ou, pior, arriscaria publicar a foto de um produto que não é o real.
2. **Depois, resolver manualmente os 3 placeholders restantes mais visíveis em `/ofertas`** (`probiotica-epic-pre-treino-300g`, `growth-coenzima-q10-100mg-60-capsulas`, `neo-quimica-melatonina-021mg-90-comprimidos`) — cada um exige pesquisa de fonte nova, não é reparável pelo pipeline automático atual (fonte bloqueada/genérica/sem metadata).
3. **Deixar os demais 11 placeholders pendentes para um lote futuro** — não aparecem entre os 21 produtos hoje visíveis em `/ofertas`, então o ganho visual imediato de resolvê-los agora é menor; continuam corretamente na fila `PendingImage`, mostrando o card ilustrativo (comportamento honesto, não é bug).
4. **Limpar o registro órfão de `Produto Price Stats`** da fila `PendingImage` quando for conveniente — cosmético, não bloqueia nada, o produto já está `ARCHIVED` e invisível em toda superfície pública.

Nenhuma dessas ações foi executada nesta auditoria — este documento é
só o diagnóstico, para servir de referência ao próximo lote de imagens.

---

_Auditoria gerada em 2026-09-16, contra o estado de produção após a publicação de imagens em `0881c9e`. Só leitura — nenhuma imagem publicada, nenhum `PendingImage` criado/alterado, nenhum código ou banco tocado._
