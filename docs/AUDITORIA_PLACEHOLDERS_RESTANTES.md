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

## 5.1 Triagem profunda dos 6 itens de "fonte bloqueada" (2026-09-18)

Cada um dos 6 pesquisado individualmente contra fonte alternativa,
respeitando o limite de publicar no máximo 1 com evidência forte:

- **`max-titanium-zma-90-capsulas` — ✅ resolvido.** Fonte alternativa
  (`otimanutri.com.br`) confirmou nome exato "ZMA - 90 Cápsulas", Max
  Titanium. Imagem baixada e inspecionada visualmente: rótulo mostra
  "7mg de Zinco, 258mg de Magnésio, 1,3mg de Vitamina B6 por porção,
  90 cápsulas" — **os três valores batem exatamente** com
  `Product.attributes` já no catálogo (`magnesiumPerDoseMg: 258`),
  confirmação numérica decisiva, não só nome. Publicada via
  `POST /api/admin/images/upload`. `PendingImage` removido (14 → 13).
- **`probiotica-hiper-100-whey-900g`** — pesquisa revelou que o
  produto real tem **4 sabores** (baunilha, chocolate, cookies and
  cream, morango), cada um com foto própria (embalagem "pode variar"
  mencionado até no próprio título da listagem Amazon). Cadastro não
  especifica sabor. **Não é candidato seguro** — mesma categoria de
  ambiguidade dos outros casos de sabor, mantido `PENDING`.
- **`growth-cafeina-100mg-120-capsulas`** — sem ambiguidade de
  produto (fórmula única, sem sabor), mas todas as fontes alternativas
  tentadas (`captainsupplements.com.br`, `virtualsuplementos.com.br`,
  `gsuplementos.com.br`) falharam por DNS inacessível deste ambiente.
  Mantido `PENDING` — não é ambiguidade, é bloqueio de acesso mesmo.
- **`growth-melatonina-021mg-100-capsulas`**,
  **`growth-coenzima-q10-100mg-60-capsulas`** (já esgotado em rodadas
  anteriores, não insistido de novo) e **`growth-cafeina-200mg-60-capsulas`**
  — não tiveram fonte alternativa viável encontrada nesta rodada
  (tempo/esforço desta frente já esgotado no item resolvido + nos 2
  investigados a fundo). Mantidos `PENDING`, ficam para próxima
  retomada.

**Critério respeitado**: exatamente 1 imagem publicada
(`max-titanium-zma-90-capsulas`), nenhuma imagem de sabor/dose
diferente aceita, nenhum outro produto tocado.

**Validação pós-mudança**: `/ofertas` responde 200; `ProductImage`/
`PendingImage` confirmados só para este produto (consulta direta ao
banco); nenhum preço, afiliado, ranking, Amazon/Mercado Livre/
Netshoes, código, schema ou `affiliate-discovery` alterado.

## 6. Resumo do entregável

| Categoria                                                                      | Qtde | Itens                                                                                                                                                    |
| ------------------------------------------------------------------------------ | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Total de placeholders (`PendingImage`)                                         | 15   | —                                                                                                                                                        |
| Relevantes (`PUBLISHED`, afeta vitrine)                                        | 13   | —                                                                                                                                                        |
| ✅ Candidato seguro — **resolvido em 2026-09-18**                              | 2    | `growth-pasta-de-amendoim-integral-torrado-1kg`, `max-titanium-zma-90-capsulas`                                                                          |
| 🔴 Pendência — precisa confirmação humana (ambiguidade real)                   | 4    | `darkness-evora-pw-limao-150g`, `probiotica-epic-pre-treino-300g`, `soldiers-nutrition-whey-protein-concentrado-1kg`, `probiotica-hiper-100-whey-900g`   |
| ⏸️ Placeholder mantido — produto despublicado/fixture (sem efeito visual)      | 2    | `nutrata-creatina-creapure-250g`, `Produto Price Stats`                                                                                                  |
| 📋 Placeholder mantido — fonte bloqueada, tentada e não resolvida ainda        | 4    | `growth-cafeina-100mg-120-capsulas`, `growth-melatonina-021mg-100-capsulas`, `growth-coenzima-q10-100mg-60-capsulas`, `growth-cafeina-200mg-60-capsulas` |
| 📋 Placeholder mantido — sem metadata de imagem, não investigado a fundo ainda | 3    | `integralmedica-coq10-30-capsulas`, `growth-zma-ultra-120-comprimidos`, `probiotica-pro-collagen-330g`                                                   |

**Estado atualizado (2026-09-18): 2 imagens publicadas ao todo nesta
frente** (`growth-pasta-de-amendoim-integral-torrado-1kg` e
`max-titanium-zma-90-capsulas`), fila `PendingImage` caiu de 15 para 13. Nenhum catálogo, afiliado, ranking, código, schema ou
`affiliate-discovery` tocado em nenhuma das duas publicações.

## 7. Próxima ação recomendada

Se a frente for retomada: dos itens restantes, nenhum tem evidência
forte pronta ainda — todos exigem nova pesquisa de fonte (os 4 de
"fonte bloqueada") ou inspeção manual da página (os 3 de "sem
metadata"), ou decisão humana de sabor (os 4 de ambiguidade real,
incluindo `probiotica-hiper-100-whey-900g`, achado nesta rodada). Cada
um deve continuar sendo investigado individualmente (nunca em lote
automático), respeitando as mesmas regras já estabelecidas: nunca
publicar sem fonte real confirmada, nunca aceitar produto/sabor/dose
diferente do exato.

---

## 8. Fechamento — mapa final dos 13 restantes (2026-09-18)

Confirmado em produção (só leitura): **13 registros em `PendingImage`**
depois das 2 resoluções desta data (Growth Pasta de Amendoim, Max
Titanium ZMA). Classificação final:

### 8.1 Ambiguidade de sabor/variação (4) — precisa decisão humana

| Produto                                           | Sabores/variações reais confirmadas                                                                                                                              | Ação humana necessária                                                                                                       | Vale insistir hoje?                                                                                   |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `probiotica-hiper-100-whey-900g`                  | 4 (baunilha, chocolate, cookies and cream, morango)                                                                                                              | Decidir qual sabor o preço/oferta capturados representam, ou aceitar que o cadastro fique sem sabor definido permanentemente | Não — precisa de dado que só existe fora deste sistema (nota fiscal, confirmação da captura original) |
| `probiotica-epic-pre-treino-300g`                 | 6 (Brazilian Fruits, Frutas Vermelhas, Guaraná com Laranja, Limão, Melancia, Tipo Energético)                                                                    | Mesma decisão acima                                                                                                          | Não                                                                                                   |
| `soldiers-nutrition-whey-protein-concentrado-1kg` | 7 (Morango, Mocaccino, Beijinho, Baunilha, Natural, Cookies, Chocolate Belga)                                                                                    | Mesma decisão acima                                                                                                          | Não                                                                                                   |
| `darkness-evora-pw-limao-150g`                    | 1 conhecida (Limão, já no nome do cadastro) — não é ambiguidade de qual sabor, é **fonte que erra o sabor** (2 tentativas já devolveram produto/sabor diferente) | Achar uma terceira fonte que garanta visualmente o sabor Limão antes de aceitar                                              | Talvez, mas não hoje — já usou 2 tentativas, uma terceira exige fonte nova ainda não identificada     |

### 8.2 Fonte bloqueada sem alternativa encontrada (4)

| Produto                                 | Fontes já tentadas                                                                                                                                      | Fonte provável para próxima tentativa                                                                                                         | Vale insistir hoje?                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `growth-coenzima-q10-100mg-60-capsulas` | 8 no total (essenciabrasileira, fitfield, towersuplementos, drogaraia, americanas, nutrigenes — marca errada, shopee, gsuplementos — bloqueio anti-bot) | Nenhuma óbvia restante — praticamente todas as lojas menores já tentadas                                                                      | Não — retornos decrescentes, mesma causa reconfirmada 2x hoje |
| `growth-cafeina-100mg-120-capsulas`     | 3 (captainsupplements, virtualsuplementos, gsuplementos — todas DNS inacessível deste ambiente)                                                         | `shopee.com.br`, `reduza.com.br`, `premiumsupplementos.com` (achadas em busca, não tentadas ainda)                                            | Sim, em outro ciclo — ainda há fontes não tentadas            |
| `growth-cafeina-200mg-60-capsulas`      | 0 tentativas nesta sessão (causa herdada de rodada anterior)                                                                                            | `cirurgicaestilo.com.br` (a própria `sourceUrl` já no catálogo)                                                                               | Sim, em outro ciclo — ainda não foi tentado hoje              |
| `growth-melatonina-021mg-100-capsulas`  | 0 tentativas nesta sessão (causa herdada de rodada anterior)                                                                                            | `essenciabrasileira.com.br` (a própria `sourceUrl`) — mesmo domínio que falhou por DNS para outros itens hoje, pode ser instabilidade pontual | Sim, em outro ciclo                                           |

### 8.3 Sem metadata suficiente (3) — precisa inspeção manual da página

| Produto                            | Situação                               | Fonte provável                                                                                                | Vale insistir hoje?                                                                   |
| ---------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `integralmedica-coq10-30-capsulas` | Página carrega, sem `og:image`/JSON-LD | Mesma `sourceUrl` já registrada — precisa inspeção visual manual da página (não busca automática de metadata) | Não — exige navegador real, indisponível nesta sessão (Chrome extension não conectou) |
| `growth-zma-ultra-120-comprimidos` | Mesma situação                         | Idem                                                                                                          | Não                                                                                   |
| `probiotica-pro-collagen-330g`     | Mesma situação                         | Idem                                                                                                          | Não                                                                                   |

### 8.4 Despublicado/sem efeito visual (2) — sem ação de imagem necessária

| Produto                          | Motivo                                                                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `nutrata-creatina-creapure-250g` | `UNPUBLISHED` — não aparece em nenhuma vitrine pública; resolver imagem não muda nada visível até (e a menos que) seja recapturado/republicado |
| `Produto Price Stats`            | Fixture de teste `ARCHIVED`, invisível publicamente — limpeza cosmética, sem urgência                                                          |

### 8.5 Resumo por grupo

| Grupo                                                  | Qtde   |
| ------------------------------------------------------ | ------ |
| Ambiguidade de sabor/variação (precisa decisão humana) | 4      |
| Fonte bloqueada sem alternativa encontrada ainda       | 4      |
| Sem metadata suficiente (precisa navegador real)       | 3      |
| Despublicado/fixture (sem efeito visual)               | 2      |
| **Total**                                              | **13** |

**Nenhum dos 13 tem candidato pronto para publicar hoje** — os 3 grupos
acionáveis (8.1, 8.2, 8.3) exigem, respectivamente: decisão humana de
sabor, uma fonte nova ainda não tentada, ou acesso a navegador real
(indisponível nesta sessão). Nenhuma imagem foi baixada, publicada ou
alterada nesta frente de fechamento — só leitura e classificação.

## 9. Próxima frente recomendada

Nenhuma das 3 categorias acionáveis é resolvível com o que está
disponível nesta sessão agora. Duas opções concretas para retomada:

1. **Tentar as 3 fontes novas do grupo 8.2** (`growth-cafeina-100mg-120-capsulas`
   via Shopee/Reduza/Premium Suplementos, `growth-cafeina-200mg-60-capsulas`
   via `cirurgicaestilo.com.br`, `growth-melatonina-021mg-100-capsulas`
   via nova tentativa em `essenciabrasileira.com.br`) — são os únicos
   com fonte candidata concreta ainda não esgotada.
2. **Resolver os 3 itens de "sem metadata"** (8.3) quando houver acesso
   a navegador real (Chrome extension conectada) — inspeção visual
   manual da página já é suficiente, não precisa de fonte nova.

Os 4 itens de ambiguidade de sabor (8.1) e os 2 de fonte
esgotada/marca errada em `growth-coenzima-q10-100mg-60-capsulas` ficam
fora de qualquer lote automático — dependem de decisão humana externa
a este sistema, não de mais tentativas de busca.

## 10. Tentativa das 3 fontes novas (2026-09-18) — nenhuma imagem publicada

Retomada específica da recomendação do §9.1, restrita às 3 fontes já
identificadas — nenhuma fonte substituta usada fora da lista.

| Produto                                | Fonte tentada                                                              | Resultado                                                                                                                                                                                                                                                                                                                   |
| -------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `growth-cafeina-100mg-120-capsulas`    | Shopee (`shopee.com.br/...i.251929510.22998387773`)                        | ❌ Conteúdo vazio — mesma renderização client-side-only que já bloqueou outras tentativas via Shopee nesta sessão (não é um erro de rede, a página não expõe conteúdo estático extraível)                                                                                                                                   |
| `growth-cafeina-200mg-60-capsulas`     | `cirurgicaestilo.com.br` (a própria `sourceUrl` já registrada no catálogo) | ❌ DNS inacessível deste ambiente (`ENOTFOUND`), com e sem `www.`                                                                                                                                                                                                                                                           |
| `growth-melatonina-021mg-100-capsulas` | Premium Suplementos (`premiumsupplementos.com`)                            | ❌ DNS inacessível deste ambiente (`ENOTFOUND`); adicionalmente, busca dedicada não confirmou que a loja sequer vende Melatonina da Growth (só Cafeína e Extrato de Laranja Moro apareceram nos resultados indexados) — mesmo que o DNS respondesse, a fonte não estava confirmada como válida para este produto específico |

**Nenhuma das 3 fontes produziu evidência utilizável.** Conforme o
critério de parada definido para esta frente: **nenhuma imagem
publicada**. `PendingImage` permanece em 13. Nenhum catálogo, preço,
afiliado, ranking, CoQ10, item de sabor ambíguo, item sem metadata,
código, schema ou `affiliate-discovery` tocado.

Não há mais fonte candidata conhecida e não tentada para nenhum dos 3
itens deste lote — a próxima tentativa exigiria descobrir uma fonte
nova (não apenas retry das 3 já esgotadas), ou aguardar que os domínios
com DNS inacessível voltem a resolver (comportamento intermitente já
observado neste ambiente ao longo da sessão, mas não previsível).

## 11. Auditoria do grupo "sem metadata suficiente" (2026-09-21)

Investigação individual dos 3 itens do grupo 8.3 — a causa registrada
pelo pipeline automático é "página carregou, mas sem `og:image`/
JSON-LD", mas isso não significa que a página não tenha imagem
nenhuma, só que o pipeline automático não sabe extraí-la sem essas
tags. Inspeção manual (via `WebFetch`, convertendo HTML para
markdown) consegue às vezes achar imagens em tags `<img>` comuns que o
pipeline ignora.

### 11.1 `integralmedica-coq10-30-capsulas` — 🟢 candidato seguro para próxima etapa

- **Nome no catálogo**: "Integralmédica CoQ10 30 Cápsulas" | **Marca**:
  Integralmédica | **Dose registrada**: 100mg CoQ10/dose | **Loja da
  captura**: Nutri Fast Shop, R$145,90 | **URL original**: a própria
  `sourceUrl` já registrada (`nutrifastshop.com.br/.../coq10-coenzima-q10-integralmedica-30-caps/`).
- **Motivo do "sem metadata"**: a página carrega normalmente (não é
  bloqueio anti-bot), só não expõe `og:image`/JSON-LD `Product` — por
  isso o pipeline automático não conseguiu extrair, mas uma imagem de
  produto real existe na página em uma tag `<img>` comum.
- **Imagem encontrada e inspecionada visualmente**: rótulo confirma
  "IntegralMédica — CoQ10 ATP Synthesis — Coenzima Q10 em Cápsulas —
  Contém 30 Cápsulas" — marca, produto e quantidade batem exatamente
  com o cadastro. Sem indício de sabor/variante (CoQ10 é cápsula pura,
  não há linha colorida conhecida da marca para este produto).
- **Risco identificado, não bloqueante**: a página de origem informa
  **67mg de CoQ10 por cápsula**, enquanto o catálogo registra
  `coq10PerDoseMg: 100`. É uma discrepância de dado nutricional, não
  de identidade do produto (mesma marca, mesmo nome, mesma
  quantidade de cápsulas) — não impede usar a foto (a foto não muda
  com a dosagem, é a mesma embalagem), mas fica registrado como
  achado à parte para quem cuidar da qualidade de dado do catálogo
  (fora do escopo desta tarefa, que é só imagem).
- **Classificação**: 🟢 **candidato seguro** — nome/marca/quantidade
  confirmados por foto real e inspecionada visualmente; pode avançar
  para publicação em uma próxima frente autorizada.

### 11.2 `growth-zma-ultra-120-comprimidos` — 🔍 precisa confirmação humana/navegador

- **Nome no catálogo**: "Growth ZMA Ultra 120 Comprimidos" | **Marca**:
  Growth Supplements | **Dose registrada**: 260mg magnésio/dose |
  **Loja da captura**: Loja Oficial Growth Supplements
  (`gsuplementos.com.br`), R$69,90 | **URL original**: a própria
  `sourceUrl` já registrada.
- **Motivo real da falta de metadata**: **não é falta de metadata** —
  a página está atrás de uma **verificação anti-bot** ("Verifying
  your browser..."), a mesma proteção que já bloqueou outras
  tentativas nesta loja em rodadas anteriores (`gsuplementos.com.br`
  também bloqueou a tentativa de `growth-coenzima-q10-100mg-60-capsulas`).
  `WebFetch` não consegue passar dessa verificação — só um navegador
  real (extensão Chrome, indisponível nesta sessão) resolveria.
- **Risco de imagem errada**: não avaliável ainda — não há imagem
  candidata para julgar.
- **Classificação**: 🔍 **precisa navegador real** — não é ambiguidade
  de produto, é limitação de ferramenta desta sessão.

### 11.3 `probiotica-pro-collagen-330g` — 🔴 reclassificado para ambiguidade de sabor

- **Nome no catálogo**: "Probiótica Pro Collagen 330g" | **Marca**:
  Probiótica | **Dose registrada**: 11g colágeno/dose | **Loja da
  captura**: CWB Gold Suplementos, R$99,90 | **URL original da
  `PriceEntry`**: `cwbgold.com.br/produto/probiotica-pro-collagen-330g.html`
  (nota: o `PendingImage.sourceUrl` registrado é diferente,
  `nutrifastshop.com.br`, mas a fonte oficial usada nesta investigação
  foi `probiotica.com.br/pro-collagen/p`, a mesma já citada em
  `attributes.sourceUrl`).
- **Achado desta investigação**: a página oficial confirma que o
  produto é vendido em **3 sabores reais** — Tangerina, Abacaxi com
  Hortelã e Limão — cada um com fotos próprias. O cadastro
  (`attributes.ingredients`: "aromatizantes" genérico, sem nome de
  sabor) **não especifica qual**. **Não é mais um caso de "sem
  metadata"** — é ambiguidade real de variação, mesma categoria dos
  outros 4 itens já classificados assim (Probiótica Hiper Whey, Epic
  Pré-Treino, Soldiers Nutrition, Darkness Évora).
- **Classificação**: 🔴 **ambiguidade de sabor — mantém placeholder**,
  precisa da mesma decisão humana externa já descrita para os outros
  casos de sabor (§8.1).

### 11.4 Validação

Nenhuma imagem baixada/publicada permanentemente (uma foi baixada
temporariamente só para inspeção visual do CoQ10 e removida em
seguida). Nenhum catálogo, preço, afiliado, ranking, item de sabor já
conhecido, item de fonte bloqueada por DNS, código, schema ou
`affiliate-discovery` alterado.

### 11.5 Recomendação — no máximo 1 próximo item

**`integralmedica-coq10-30-capsulas`** é o único dos 3 pronto para
avançar — nome, marca e quantidade já confirmados por foto real
inspecionada visualmente. Recomendo esta ser a próxima publicação,
sujeita à mesma autorização explícita já usada nas publicações
anteriores desta frente (Growth Pasta de Amendoim, Max Titanium ZMA).
Os outros 2 ficam: `growth-zma-ultra-120-comprimidos` pendente de
navegador real; `probiotica-pro-collagen-330g` pendente de decisão
humana de sabor (junto com os outros 4 casos já conhecidos).
