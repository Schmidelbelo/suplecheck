# Auditoria geral de placeholders de imagem restantes

Levantamento **só leitura** contra produção, 2026-09-18 — mapeamento
completo do que resta na fila `PendingImage` depois das resoluções já
aplicadas em `docs/AUDITORIA_COBERTURA_IMAGENS.md` (§8/§9/§10: 3
imagens publicadas, 2 correções de nome de catálogo, 1 produto
despublicado por cadastro inválido). **Nenhuma imagem baixada,
publicada ou alterada nesta auditoria** — só consulta a
`PendingImage`/`Product` já existentes, mais pesquisa web para avaliar
viabilidade dos candidatos.

---

## 1. Total atual

| Métrica                                                                     | Valor                                    |
| --------------------------------------------------------------------------- | ---------------------------------------- |
| Registros em `PendingImage`                                                 | **15**                                   |
| Desses, produto ainda `PUBLISHED` (relevante para `/ofertas`/vitrine)       | **13**                                   |
| Produto `UNPUBLISHED` (não aparece em nenhuma vitrine pública hoje)         | **1** — `nutrata-creatina-creapure-250g` |
| Órfão de fixture de teste já `ARCHIVED` (invisível publicamente, cosmético) | **1** — `Produto Price Stats`            |

Os 13 relevantes são o universo real desta auditoria — os outros 2
registros existem na fila, mas não produzem nenhum placeholder visível
para um usuário real hoje.

## 2. Classificação por causa (13 produtos `PUBLISHED` relevantes)

| Causa                                                                                                                   | Qtde | Produtos                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fonte bloqueada/indisponível** (site não responde, timeout, verificação anti-bot)                                     | 6    | `probiotica-hiper-100-whey-900g`, `growth-cafeina-100mg-120-capsulas`, `growth-melatonina-021mg-100-capsulas`, `max-titanium-zma-90-capsulas`, `growth-coenzima-q10-100mg-60-capsulas`, `growth-cafeina-200mg-60-capsulas` |
| **Fonte carrega mas sem metadata de imagem** (`og:image`/JSON-LD ausentes)                                              | 3    | `integralmedica-coq10-30-capsulas`, `growth-zma-ultra-120-comprimidos`, `probiotica-pro-collagen-330g`                                                                                                                     |
| **Ambiguidade de sabor/variação confirmada**                                                                            | 2    | `darkness-evora-pw-limao-150g` (2 tentativas já devolveram sabor/produto errado), `probiotica-epic-pre-treino-300g` (6 sabores reais confirmados, catálogo não especifica)                                                 |
| **Fonte genérica, mas produto sem ambiguidade real** (candidato viável)                                                 | 1    | `growth-pasta-de-amendoim-integral-torrado-1kg` — ver §3                                                                                                                                                                   |
| **Ambiguidade de sabor recém-identificada nesta auditoria** (estava classificado como "fonte genérica", reclassificado) | 1    | `soldiers-nutrition-whey-protein-concentrado-1kg` — ver §3                                                                                                                                                                 |

Nenhuma ambiguidade de SKU/peso restante entre os `PUBLISHED` — o
único caso desse tipo (`nutrata-creatina-creapure-250g`) já foi tratado
despublicando o produto, fora do escopo de imagem agora.

## 3. Top candidatos seguros (avaliação de viabilidade, sem baixar imagem)

### `growth-pasta-de-amendoim-integral-torrado-1kg` — 🟢 risco baixo — ✅ RESOLVIDO (2026-09-18)

- **Marca**: Growth Supplements.
- **Por que é candidato seguro**: a causa registrada é só "fonte
  genérica" (a `sourceUrl` atual é uma página do OpenFoodFacts, um
  banco de dados nutricional, não uma loja) — não é ambiguidade de
  produto. A Growth vende uma linha de pasta de amendoim **com
  sabor**, em potes de **500g** (confirmado: 8 sabores — cookies,
  brigadeiro, caramelo, chocolate intenso, banana, morango, crocante,
  entre outros) — mas o cadastro é especificamente **1kg**, peso
  diferente, e os atributos já registrados (`ingredients: "Amendoim
torrado (ingrediente único)"`) descrevem a versão **integral/natural
  sem sabor**, que é um produto distinto da linha colorida de 500g.
  Peso e composição já deixam claro qual variante é — baixo risco de
  pegar a foto errada.
- **Evidência necessária**: confirmar visualmente (fonte real, não
  banco de dados nutricional) que a embalagem de 1kg "Integral
  Torrado" existe com esse nome exato e que a foto corresponde a essa
  variante específica (não a algum pote de 500g com sabor).
- **Fonte provável**: `goldstarsupplements.com.br` — já é a loja
  registrada como `Store` deste `PriceEntry` no catálogo (mesma loja
  da oferta atual), reduz o risco de pegar produto de revendedor
  errado.
- **Risco**: 🟢 baixo — peso e composição já desambiguam a variante;
  falta só encontrar/confirmar a foto real.

**Resolução aplicada (2026-09-18)**: fonte real confirmada em
`goldstarsupplements.com.br/produtos/pasta-de-amendoim-integral-torrado-1kg-original-growth-supplements/`
— a mesma URL já registrada como `sourceUrl` do produto, não uma fonte
nova. Nome exato confirmado: **"Pasta de Amendoim Integral Torrado 1Kg
Original - Growth Supplements"**. Imagem baixada e **inspecionada
visualmente** antes de publicar — rótulo confirma "PASTA DE AMENDOIM —
SABOR NATURAL — AMENDOIM INTEGRAL — PESO LÍQ. 1,005KG — GROWTH
SUPPLEMENTS", exatamente o produto do cadastro, sem sabor colorido, sem
mistura com a linha de 500g. Publicada via `POST /api/admin/images/upload`
(endpoint administrativo existente, upload manual — não candidato
automático, não lote).

- **Antes**: card ilustrativo, `PendingImage` `PENDING`.
- **Depois**: capa real no Vercel Blob
  (`.../products/growth-pasta-de-amendoim-integral-torrado-1kg.webp`,
  HTTP 200), `PendingImage` removido da fila (15 → 14), página do
  produto (`/categorias/pasta-de-amendoim/growth-pasta-de-amendoim-integral-torrado-1kg`)
  confirmada renderizando a imagem nova.
- **Validação**: `/ofertas` responde 200 antes e depois; nenhum outro
  `PendingImage`/`ProductImage`/produto tocado (confirmado por consulta
  direta ao banco); nenhum preço, afiliado, ranking, Amazon/Mercado
  Livre/Netshoes ou `affiliate-discovery` alterado.

### `soldiers-nutrition-whey-protein-concentrado-1kg` — 🔴 reclassificado para alto risco

- **Marca**: Soldiers Nutrition.
- **Achado desta auditoria**: a causa registrada hoje é "fonte
  genérica", mas a pesquisa revelou que o produto real tem **7 sabores
  distintos** (Morango, Mocaccino, Beijinho, Baunilha, Natural,
  Cookies, Chocolate Belga), com informação nutricional que **varia
  por sabor** (18g ou 30g de proteína por dose, dependendo do sabor).
  O cadastro (`attributes.ingredients`) não especifica nenhum sabor.
  **Isso não é mais um caso de "fonte genérica resolvível"** — é
  ambiguidade real de variação, mesma categoria do caso Epic
  Pré-Treino/Darkness Évora.
- **Risco**: 🔴 alto — não buscar imagem até haver sinal de qual sabor
  o cadastro representa (ou decisão humana de qual sabor usar como
  padrão).

## 4. Pendências que precisam de confirmação humana (ambiguidade real, sem caminho automático)

- **`darkness-evora-pw-limao-150g`** — já teve 2 tentativas de fonte
  rejeitadas por devolver produto/sabor errado. O nome do cadastro já
  especifica "Limão", então não é ambiguidade de _qual_ sabor — é
  dificuldade de achar uma fonte que garanta a foto do sabor certo.
  Precisa de nova fonte específica, não decisão humana de escolha, mas
  fica nesta categoria por já ter esgotado 2 tentativas.
- **`probiotica-epic-pre-treino-300g`** — 6 sabores reais confirmados
  (§10 do outro documento), catálogo não especifica nenhum. Só
  resolve com decisão humana de qual sabor o SKU/preço capturado
  representa, ou com uma fonte que amarre inequivocamente o preço já
  capturado (R$88,89) a um sabor específico.
- **`soldiers-nutrition-whey-protein-concentrado-1kg`** — mesma
  categoria, achado novo desta auditoria (ver §3).

## 5. Itens que devem permanecer placeholder (sem ação recomendada agora)

- **`nutrata-creatina-creapure-250g`** — produto `UNPUBLISHED`
  (docs/AUDITORIA_OPORTUNIDADES_MONETIZACAO.md §3.2); não aparece em
  nenhuma vitrine pública, então resolver a imagem não tem efeito
  visual até (e a menos que) o produto seja recapturado/republicado.
- **`Produto Price Stats`** — fixture de teste já `ARCHIVED`, invisível
  publicamente. Limpeza cosmética da fila, sem urgência (mesma nota já
  registrada em `docs/AUDITORIA_COBERTURA_IMAGENS.md §1`).
- **6 itens de "fonte bloqueada/indisponível"**
  (`probiotica-hiper-100-whey-900g`, `growth-cafeina-100mg-120-capsulas`,
  `growth-melatonina-021mg-100-capsulas`, `max-titanium-zma-90-capsulas`,
  `growth-coenzima-q10-100mg-60-capsulas`,
  `growth-cafeina-200mg-60-capsulas`) — 2 desses (Growth Coenzima Q10 e
  Cafeína) já tiveram múltiplas fontes tentadas sem sucesso em rodadas
  anteriores; os outros 4 ainda não foram tentados nesta sessão, mas a
  causa registrada indica o mesmo padrão (bloqueio de acesso). Não
  investigados a fundo nesta auditoria (que é só mapeamento, não
  resolução) — ficam como próximo lote, não como "sem solução".
- **3 itens de "sem metadata"** (`integralmedica-coq10-30-capsulas`,
  `growth-zma-ultra-120-comprimidos`, `probiotica-pro-collagen-330g`)
  — página acessível, mas sem tag de imagem utilizável pelo pipeline
  automático; precisam de inspeção manual da página (não
  necessariamente bloqueada, só sem metadata padrão) para achar a
  imagem certa manualmente. Não investigados a fundo nesta auditoria.

## 6. Resumo do entregável

| Categoria                                                                      | Qtde | Itens                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------ | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Total de placeholders (`PendingImage`)                                         | 15   | —                                                                                                                                                                                                                          |
| Relevantes (`PUBLISHED`, afeta vitrine)                                        | 13   | —                                                                                                                                                                                                                          |
| ✅ Candidato seguro — **resolvido em 2026-09-18**                              | 1    | `growth-pasta-de-amendoim-integral-torrado-1kg`                                                                                                                                                                            |
| 🔴 Pendência — precisa confirmação humana (ambiguidade real)                   | 3    | `darkness-evora-pw-limao-150g`, `probiotica-epic-pre-treino-300g`, `soldiers-nutrition-whey-protein-concentrado-1kg`                                                                                                       |
| ⏸️ Placeholder mantido — produto despublicado/fixture (sem efeito visual)      | 2    | `nutrata-creatina-creapure-250g`, `Produto Price Stats`                                                                                                                                                                    |
| 📋 Placeholder mantido — fonte bloqueada, não investigado a fundo ainda        | 6    | `probiotica-hiper-100-whey-900g`, `growth-cafeina-100mg-120-capsulas`, `growth-melatonina-021mg-100-capsulas`, `max-titanium-zma-90-capsulas`, `growth-coenzima-q10-100mg-60-capsulas`, `growth-cafeina-200mg-60-capsulas` |
| 📋 Placeholder mantido — sem metadata de imagem, não investigado a fundo ainda | 3    | `integralmedica-coq10-30-capsulas`, `growth-zma-ultra-120-comprimidos`, `probiotica-pro-collagen-330g`                                                                                                                     |

**Nenhuma imagem foi baixada, publicada ou alterada nesta auditoria.**
Nenhum catálogo, afiliado, ranking, código, schema ou
`affiliate-discovery` tocado.

## 7. Próxima ação recomendada

Se a frente for retomada: validar `growth-pasta-de-amendoim-integral-torrado-1kg`
primeiro (único candidato de baixo risco identificado), com o mesmo
rigor das resoluções anteriores — baixar e inspecionar visualmente a
imagem antes de publicar, confirmar peso 1kg e ausência de sabor no
rótulo. Os demais itens ficam para lotes futuros, cada um investigado
individualmente (nunca em lote automático), respeitando as mesmas
regras já estabelecidas: nunca publicar sem fonte real confirmada,
nunca aceitar produto/sabor/peso diferente do exato.
