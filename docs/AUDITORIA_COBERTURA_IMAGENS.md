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

## 6. Atualização (2026-09-16) — 2 dos 3 erros de catálogo corrigidos

Recomendação da §5.1 executada parcialmente, via `PATCH
/api/catalog/products/{slug}` (API administrativa já existente, protegida
por `ADMIN_API_KEY` — nenhum código novo, nenhum dado no banco além do
campo `name`):

| Produto                              | Antes                         | Depois                               | Evidência                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------ | ----------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `growth-creatina-monohidratada-300g` | `Creatina Monohidratada 300g` | **`Creatina Monohidratada 250g`**    | Growth não vende 300g; 250g é embalagem real confirmada (realsuplementos.com.br, bodyshopsuplementos.com.br) e o preço já capturado no catálogo (R$49,90) cai dentro da faixa real de 250g                                                                                                                                                                                                                                                             |
| `atlhetica-creatina-300g`            | `Creatina Nitro 300g`         | **`Creatina 100% Pure 300g`**        | Linha "Nitro" não existe na Atlhetica; 300g já era o peso real — só o nome estava errado (confirmado via listagem Amazon "Creatina 100% Pure em Pó 300g, Atlhetica Nutrition")                                                                                                                                                                                                                                                                         |
| `nutrata-creatina-creapure-250g`     | `Creatina Creapure 250g`      | **sem alteração — mantido pendente** | Nutrata vende Creapure real em 150g **e** 300g; o preço já capturado (R$69,90) não bate com a faixa real de nenhum dos dois (150g: ~R$116–162; 300g: ~R$149–299), então não há sinal forte o bastante para escolher entre os dois sem arriscar inventar o SKU. Precisa de fonte mais forte antes de corrigir: página oficial do produto exato, nota fiscal, captura de preço confiável, ou confirmação direta da loja de onde veio o R$69,90 original. |

**Limitação encontrada**: `PendingImage.reason` dos 3 registros **não pôde
ser atualizado** — não existe nenhum endpoint administrativo de escrita
para esse campo hoje (`GET /api/admin/images/pending` é somente leitura;
`publish`/`publish-all` só tocam candidatos já aprovados; o guardrail
automático só cria ou apaga a linha, nunca atualiza o texto de um
`PENDING` existente). Ação corretiva ficou fora de escopo desta tarefa
(proibido alterar código). Efeito prático: os `reason` de Growth e
Atlhetica na fila continuam com o texto antigo ("ERRO DE DADOS DO
CATÁLOGO... requer correção") mesmo após a correção — texto desatualizado,
mas sem risco funcional (o nome do produto já está certo; a busca de
imagem do próximo lote pode simplesmente ignorar esse texto e usar o
nome/peso atuais, já corrigidos, como base de pesquisa). Corrigir isso de
verdade exige uma pequena rota administrativa nova (`PATCH` para
`PendingImage.reason`) ou acesso direto ao banco — recomendado como item
pequeno de follow-up, não urgente.

Validado após a correção: `/ofertas` continua respondendo 200 e estável;
as páginas de `growth-creatina-monohidratada-300g` e
`atlhetica-creatina-300g` renderizam o nome novo; nenhuma imagem foi
publicada; nenhum afiliado foi alterado.

## 7. Próxima ação recomendada (registrada, não executada)

Com os 2 erros de catálogo corrigidos (§6), o próximo passo é resolver
manualmente — **não em lote automático** — os 3 placeholders mais
visíveis em `/ofertas` que ainda dependem de pesquisa de fonte nova (não
são erro de catálogo, então já podem ser buscados):

1. **`probiotica-epic-pre-treino-300g`** (Probiótica Epic Pré-Treino) — fonte bloqueada
2. **`growth-coenzima-q10-100mg-60-capsulas`** (Growth CoQ10) — fonte sem metadata
3. **`neo-quimica-melatonina-021mg-90-comprimidos`** (Neo Química Melatonina) — fonte genérica

Regras para essa resolução manual, quando for executada:

- **Não publicar nenhuma imagem sem fonte real confirmada** — nunca aceitar candidato de baixa confiança ou de produto/sabor diferente do exato.
- **Não inventar candidato** — se não existir fonte pública confiável para o produto exato, o item continua `PENDING`, mostrando o card ilustrativo (comportamento honesto, não é bug).
- **`nutrata-creatina-creapure-250g` continua pendente** por ambiguidade real de SKU (§6) — não faz parte deste lote e não deve ser resolvido por aproximação.
- **Afiliados continuam intocados** — nenhuma ação de imagem deve alterar `Store.isAffiliate`, `affiliateBaseUrl` ou qualquer dado de monetização.

Nenhum script foi rodado, nenhuma imagem foi publicada, nenhum banco ou
código foi alterado para registrar esta recomendação — é só o próximo
item da fila, documentado para quando for autorizado a executar.

## 8. Resolução manual (2026-09-17) — 1 de 3 resolvido, 2 seguem pendentes

Retomada item a item, cada produto pesquisado individualmente contra
fonte real e específica — nenhum lote automático, nenhuma imagem
publicada sem validação clara do produto exato.

### 8.1 `neo-quimica-melatonina-021mg-90-comprimidos` — ✅ resolvido

- **Fonte**: a própria `sourceUrl` já registrada no catálogo (Amazon,
  `dp/B0B5S7L3VN`) — não uma fonte nova, o produto exato já apontado
  pelo dado existente.
- **Validação**: tabela de especificação do produto na página confirma
  `Marca: NEO QUIMICA`, `Sabor: Maracujá` — batendo exatamente com
  `Product.attributes.ingredients` ("sabor maracujá") já no catálogo.
  Título confirma "90 cápsulas". Imagem baixada e inspecionada
  visualmente antes de publicar: rótulo mostra "Neo Química — Melatonina
  — 90 unidades — Suplemento Alimentar em Comprimido Orodispersível" —
  produto exato, sem ambiguidade de marca/sabor/quantidade.
- **Ação**: candidato baixado e publicado via
  `POST /api/admin/images/upload` (endpoint administrativo existente de
  upload manual — não criação de candidato automático, não lote).
- **Antes**: card ilustrativo (`neo-quimica-melatonina-021mg-90-comprimidos-card.webp`), `PendingImage` com `status: PENDING`.
- **Depois**: capa real no Blob (`.../products/neo-quimica-melatonina-021mg-90-comprimidos.webp`, HTTP 200, confirmada publicamente acessível); `PendingImage` removido da fila (guardrail automático); página do produto (`/categorias/melatonina/neo-quimica-melatonina-021mg-90-comprimidos`) já renderiza a imagem nova.

### 8.2 `growth-coenzima-q10-100mg-60-capsulas` — ainda `PENDING`

Pesquisa tentou 5 fontes distintas (site oficial `gsuplementos.com.br` —
o mesmo já registrado como `sourceUrl` no catálogo —, além de
`fitfield.com.br`, `essenciabrasileira.com.br`, `towersuplementos.com`,
`drogaraia.com.br`, `americanas.com.br`): todas bloqueadas (verificação
anti-bot, "Acesso Bloqueado", DNS inacessível a partir deste ambiente,
ou 403/404). Nenhuma retornou conteúdo utilizável. **Reconfirma** a
causa já registrada no `PendingImage.reason` ("fonte sem metadata"/
bloqueio de acesso) — mantido `PENDING`, nenhum candidato inventado.

### 8.3 `probiotica-epic-pre-treino-300g` — ainda `PENDING`, causa nova identificada

Fonte oficial (`probiotica.com.br/epic-300g/p`) respondeu normalmente,
mas revelou uma ambiguidade real: **Epic Pré-Treino 300g é vendido em
pelo menos 5 sabores distintos** (Melancia, Brazilian Fruits, Guaraná
com Laranja, Tipo Energético, entre outros), cada um com SKU e foto
própria — confirmado via JSON-LD `Product` da página oficial, um bloco
por sabor. O catálogo do SupleScore **não especifica sabor** para este
produto (`Product.attributes.ingredients` não menciona nenhum sabor
específico). Sem saber qual sabor o preço/oferta capturados realmente
representam, publicar a foto de qualquer sabor arriscaria "imagem de
sabor diferente" — proibido nesta tarefa. Mantido `PENDING`. Causa a
documentar/corrigir no `PendingImage.reason` (sem endpoint disponível
para isso, mesma limitação já registrada em §6): produto tem sabor
ambíguo no catálogo, precisa de decisão de qual sabor representar antes
de qualquer busca de imagem fazer sentido — mesma categoria de problema
do caso Nutrata (§6), não resolver por aproximação.

### 8.4 Validação pós-mudança (primeira rodada)

- `/ofertas` responde 200, estável.
- Fila `PendingImage`: 18 → 17 (só a melatonina saiu).
- Nenhum afiliado alterado, nenhum `affiliateBaseUrl` tocado, Mercado
  Livre e Netshoes não mexidos, Nutrata não mexido, nenhum slug
  alterado, nenhum lote automático rodado.

## 9. Segunda rodada (2026-09-17) — reavaliação após correção de catálogo

Com `growth-creatina-monohidratada-300g` e `atlhetica-creatina-300g` já
corrigidos no catálogo (§6, nomes certos: `Creatina Monohidratada 250g`
e `Creatina 100% Pure 300g`), esses dois deixaram de ser "erro de
catálogo" e passaram a ser pesquisáveis como qualquer outro placeholder.
Reavaliados agora, individualmente, com fonte forte encontrada para os
dois:

### 9.1 `growth-creatina-monohidratada-300g` — ✅ resolvido

- **Fonte**: `xtrategynutrition.com` (revenda internacional) — título da
  página "Creatina Monohidratada/Creatine Monohydrate Powder 250g -
  Growth Supplements" bate exatamente com o nome corrigido no catálogo.
- **Validação**: imagem baixada e inspecionada visualmente antes de
  publicar — rótulo mostra "Growth — Monohidratada Creatina —
  Suplemento Alimentar em Pó — Peso Líquido 250g". Produto, marca e peso
  exatos, sem ambiguidade de sabor (produto é sem sabor).
- **Ação**: publicado via `POST /api/admin/images/upload`.
- **Antes**: card ilustrativo, `PendingImage` `PENDING`. **Depois**:
  capa real no Blob (`.../products/growth-creatina-monohidratada-300g.webp`,
  HTTP 200), `PendingImage` removido, página do produto já renderiza a
  imagem nova.

### 9.2 `atlhetica-creatina-300g` — ✅ resolvido

- **Fonte**: `curitibasuplementos.com.br` — título "Creatine 100% Pure
  (300g)" bate com o nome corrigido no catálogo. (Fontes tentadas antes
  desta: Amazon bloqueou com captcha após uso intensivo nesta sessão;
  o site oficial `atlheticanutrition.com.br` carregou normalmente mas
  seu `og:image` apontava para um arquivo quebrado/vazio no CDN deles —
  descartado por não ser uma imagem real, não por desconfiança da
  fonte.)
- **Validação**: imagem baixada e inspecionada visualmente antes de
  publicar — rótulo mostra "Atlhetica Nutrition — Creatine Monohydrate
  100% Pure — 3g Creatine". Produto, marca e peso exatos.
- **Ação**: publicado via `POST /api/admin/images/upload`.
- **Antes**: card ilustrativo, `PendingImage` `PENDING`. **Depois**:
  capa real no Blob (`.../products/atlhetica-creatina-300g.webp`, HTTP
  200), `PendingImage` removido, página do produto já renderiza a
  imagem nova.

### 9.3 Itens não reavaliados (causa inalterada, não insistido)

- `growth-coenzima-q10-100mg-60-capsulas`: continua bloqueado nas
  mesmas 5 fontes já tentadas em §8.2 — não insistido de novo, mesma
  causa.
- `probiotica-epic-pre-treino-300g`: continua ambíguo por sabor (§8.3)
  — não insistido de novo, mesma causa.
- `nutrata-creatina-creapure-250g`: não tocado, ambiguidade de SKU
  segue sem fonte forte o bastante para decidir (§6).

### 9.4 Validação pós-mudança (segunda rodada)

- `/ofertas` responde 200, estável.
- Fila `PendingImage`: 17 → 15 (Growth e Atlhetica saíram).
- Páginas `/creatina/growth-creatina-monohidratada-300g` e
  `/creatina/atlhetica-creatina-300g` confirmadas renderizando a imagem
  nova.
- Nenhum afiliado, Mercado Livre, Netshoes, Nutrata, slug, banco além
  de `ProductImage`/`PendingImage` destes 2 itens, ou trabalho de
  `affiliate-discovery` tocado. Nenhum lote automático rodado — os 2
  itens foram pesquisados e publicados um de cada vez.

**Total do dia (2026-09-17)**: 3 imagens publicadas
(`neo-quimica-melatonina-021mg-90-comprimidos`,
`growth-creatina-monohidratada-300g`, `atlhetica-creatina-300g`), fila
`PendingImage` caiu de 18 para 15. A frente visual chegou no limite
seguro do dia: os 3 itens restantes (`growth-coenzima-q10-...`,
`probiotica-epic-pre-treino-300g`, `nutrata-creatina-creapure-250g`)
têm causas reais e documentadas que não se resolvem por mais tentativas
hoje — exigem, respectivamente, uma fonte que não esteja bloqueada,
uma decisão de qual sabor o SKU representa, e uma fonte forte o
bastante para desempatar 150g/300g.

---

_Auditoria gerada em 2026-09-16, contra o estado de produção após a publicação de imagens em `0881c9e`. Só leitura — nenhuma imagem publicada, nenhum `PendingImage` criado/alterado, nenhum código ou banco tocado. §6 é a exceção: 2 correções pontuais de `Product.name` via API administrativa já existente, aplicadas na mesma data. §7 é só recomendação registrada, não executada. §8/§9 (2026-09-17) são a segunda exceção: 3 imagens publicadas via upload manual validado item a item ao longo do dia, 3 produtos seguem `PENDING` por bloqueio de fonte, ambiguidade de sabor e ambiguidade de SKU, respectivamente._
