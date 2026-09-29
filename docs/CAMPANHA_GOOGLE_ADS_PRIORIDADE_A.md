# Campanha Google Ads — 10 produtos prioridade A (plano para revisão)

**Status: plano, nada criado.** Nenhuma campanha foi criada no Google
Ads e nenhuma verba foi gasta. O site, o banco e o código não foram
alterados, e `affiliate-discovery` não foi tocado. Produtos: os 10 de
prioridade A de `docs/RECAPTURA_PRECOS_VITRINE_2026-09-29.md`.

Arquivos prontos para importar e revisar no Google Ads Editor, em
`work/google-ads-prioridade-a/`:

| Arquivo                 | Conteúdo                                                                                |
| ----------------------- | --------------------------------------------------------------------------------------- |
| `campaigns.csv`         | 2 campanhas (pausadas), orçamento, rede, local, idioma, lance, template de rastreamento |
| `ad-groups.csv`         | 11 grupos de anúncio, CPC máximo e URL final                                            |
| `keywords.csv`          | 38 palavras-chave (só exata e frase, nenhuma ampla)                                     |
| `negative-keywords.csv` | 78 negativas (lista compartilhada, por campanha e por grupo) com o motivo de cada       |
| `ads-rsa.csv`           | 11 anúncios responsivos de pesquisa (até 15 títulos, 4 descrições)                      |
| `assets.csv`            | sitelinks e frases de destaque                                                          |

Todos os títulos têm ≤ 30 caracteres, as descrições ≤ 90 e os caminhos
≤ 15. Os limites foram validados por script antes de gerar os arquivos.

---

## 0. Leia antes de ativar: 2 achados que mudam a leitura do teste

### 0.1 O site não tem tag de medição nenhuma

Os HTMLs de `/`, `/creatina` e da página de produto em produção (29/09)
não carregam nenhum script do Google (nem GA4 nem tag de conversão do
Google Ads). `NEXT_PUBLIC_GA_ID` não está definido no deploy, e o evento
`outbound_link_clicked` do `/go` só é logado no servidor
(`analytics.server.ts`), sem ir a lugar nenhum.

Consequências:

- **Não dá para usar lance por conversão** (Maximizar conversões, CPA
  desejado). Por isso o plano usa **CPC manual**.
- **UTM não é lida por ninguém hoje.** Vale colocá-la mesmo assim: fica
  nos logs de request da Vercel e passa a valer no dia em que o GA4 for
  ligado. O `gclid` (auto-tagging) também.
- **A atribuição do teste será por janela de tempo.** Os cliques de saída
  orgânicos nos 10 produtos A foram de 21 em 14 dias, e o site inteiro
  teve de 0 a 1 clique de saída por dia nos últimos 10 dias. Com isso,
  quase todo clique de saída novo durante a campanha pode ser atribuído
  ao anúncio. Referência: `outbound_clicks` com `source` diferente de
  `unknown` (os cliques de validação que fiz ficam em `unknown`).
- **Recomendação para uma próxima tarefa (não feita aqui, exige mexer no
  site)**: ligar o GA4 (`NEXT_PUBLIC_GA_ID`) e disparar um evento
  client-side no clique de "Ver oferta", importado como conversão no
  Google Ads. Sem isso, a campanha não passa de um teste de funil
  medido à mão.

### 0.2 A conta provavelmente não fecha no azul: é um teste de aprendizado

Estimativa do CPC que empata com a comissão:

```
CPC de empate = ticket × comissão × (% clique no anúncio → clique /go) × (% clique /go → compra)
```

| Premissa                      | Valor usado   | Fonte                                                            |
| ----------------------------- | ------------- | ---------------------------------------------------------------- |
| Ticket                        | R$ 45         | média das 5 creatinas A (R$ 28–87)                               |
| % anúncio → `/go`             | 40%           | **hipótese**, é o que o teste mede                               |
| % `/go` → compra              | 8%            | **hipótese**, é o que o teste mede                               |
| Comissão Amazon (suplementos) | 3% / 6% / 10% | **não confirmada**, conferir a taxa real no portal de Associados |

| Comissão | CPC de empate |
| -------- | ------------- |
| 3%       | R$ 0,04       |
| 6%       | R$ 0,09       |
| 10%      | R$ 0,14       |

CPC típico de busca por suplemento no Brasil costuma ficar bem acima
disso. O cookie de 24h da Amazon (comissão sobre o carrinho inteiro)
melhora a conta, mas dificilmente fecha a diferença. **Trate a verba como
custo para descobrir as 2 taxas reais do funil**, não como investimento
com retorno esperado. O orçamento abaixo foi dimensionado para isso.

---

## 1. Objetivo da campanha

- **Tipo**: Rede de Pesquisa, sem objetivo de meta (ou "Tráfego do
  site"). Não usar Performance Max nem Display: sem conversão configurada,
  eles gastam em tráfego de baixa intenção.
- **O que o teste precisa responder em 7 dias**:
  1. Qual % de quem clica no anúncio segue para a loja (`/go` afiliado)?
  2. Esses cliques geram pedido no relatório da Amazon Associates?
  3. Qual custo por clique afiliado e qual EPC (ganho por clique)?

## 2. Orçamento

| Item              | Valor                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| Campanha Creatina | **R$ 10/dia**                                                                                                  |
| Campanha Outros   | **R$ 5/dia**                                                                                                   |
| Total diário      | **R$ 15/dia**                                                                                                  |
| Duração           | 7 dias                                                                                                         |
| **Teto do teste** | **R$ 100**: parar ao atingir, mesmo antes do dia 7                                                             |
| Lance             | CPC manual, sem CPC otimizado. Máximo de R$ 0,70 no grupo genérico de creatina e R$ 0,50 nos grupos de produto |

O Google pode gastar até 2× o orçamento diário num dia, mas respeita o
limite mensal. O teto de R$ 100 é controle manual seu: não existe
"orçamento total" em campanha de pesquisa comum. Opcional: limite de
gasto da conta em R$ 100 em Faturamento > Controles da conta.

## 3. Segmentação

| Item         | Configuração                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| Redes        | Só Pesquisa Google. **Desmarcar** Parceiros de pesquisa e Rede de Display                                  |
| Local        | Brasil, opção **"Presença"** (pessoas no local), não "interesse"                                           |
| Idioma       | Português                                                                                                  |
| Horário      | 07:00–23:59 (corta a madrugada, que tende a ter clique de baixa intenção)                                  |
| Dispositivos | Todos, sem ajuste no início. Rever no dia 4                                                                |
| Público      | Nenhum público de segmentação. Pode adicionar "Suplementos/Fitness" em modo **observação** só para leitura |

## 4. Estrutura

```
SS | Search | Creatina | Teste PA        R$10/dia
├── Creatina - comparacao               → /creatina              (genérico)
├── Creatina - Max Titanium             → /creatina/max-titanium-creatina-300g
├── Creatina - Black Skull              → /creatina/black-skull-creatina-300g
├── Creatina - Probiotica               → /creatina/probiotica-creatina-300g
├── Creatina - Atlhetica                → /creatina/atlhetica-creatina-300g
└── Creatina - Optimum Nutrition        → /creatina/optimum-nutrition-creatine-300g

SS | Search | Outros PA | Teste          R$5/dia
├── Pre-treino - Horus                  → /categorias/pre-treino/max-titanium-horus-300g
├── Pre-treino - Evora                  → /categorias/pre-treino/darkness-evora-pw-limao-150g
├── Glutamina - Integralmedica          → /categorias/glutamina/integralmedica-glutamina-300g
├── BCAA - Max Titanium                 → /categorias/bcaa/max-titanium-bcaa-2400-100-capsulas
└── Melatonina - Neo Quimica  ⏸️ PAUSADO → /categorias/melatonina/neo-quimica-melatonina-021mg-90-comprimidos
```

Por que esta divisão:

- **Creatina tem campanha própria** porque é o único caso em que existe
  uma página de comparação (`/creatina`) listando **só** produtos
  monetizados (as 5 creatinas A, conferido em 29/09). É o melhor destino
  para busca genérica e o grupo com mais volume. Separar as campanhas
  impede que creatina consuma a verba dos outros e vice-versa.
- **Busca de marca vai para a página do produto**, busca genérica vai
  para a comparação. As marcas das 5 creatinas estão como negativas no
  grupo genérico, para cada busca cair no grupo certo.
- **Melatonina começa pausada**: o ticket é de R$ 15 (comissão de
  centavos), o tema é sensível (sono) e o risco de reprovação pela
  política de saúde do Google é maior. Só ativar depois de o resto
  funcionar, e sem nenhuma menção a sono em anúncio.

## 5. Grupos de anúncio, palavras-chave e anúncios

### Campanha `SS | Search | Creatina | Teste PA`

#### Creatina - comparacao

- **Destino**: `/creatina`
- **CPC máx.**: R$ 0,70
- **Palavras-chave**: `[melhor creatina]`, `"melhor creatina"`, `[qual a melhor creatina]`, `[melhor creatina custo beneficio]`, `"creatina custo beneficio"`, `"ranking creatina"`, `"comparar creatina"`, `[creatina 300g]`, `"creatina monohidratada 300g"`, `"creatina 300g preço"`
- **Títulos** (12):
  - Compare Creatinas de 300g (25)
  - Ranking de Creatina 2026 (24)
  - Preço por Dose Lado a Lado (26)
  - Nota e Custo-Benefício (22)
  - Escolha Com Dados Reais (23)
  - Creatina Monohidratada (22)
  - 5 Marcas Comparadas (19)
  - Grátis e Sem Cadastro (21)
  - Critérios Públicos (18)
  - Compare e Vá à Oferta (21)
  - Veja os Preços Atuais (21)
  - Metodologia Aberta (18)
- **Descrições**:
  - Compare creatinas de 300g por preço por dose, nota e custo-benefício antes de comprar. (86)
  - Ranking com critérios públicos. Veja os preços e siga para a loja em um clique. (79)
  - Creatina monohidratada de marcas conhecidas lado a lado. Grátis e sem cadastro. (79)
  - Descubra quanto custa cada dose e escolha a opção que cabe no seu orçamento. (76)

#### Creatina - Max Titanium

- **Destino**: `/creatina/max-titanium-creatina-300g`
- **CPC máx.**: R$ 0,50
- **Palavras-chave**: `[creatina max titanium]`, `"creatina max titanium 300g"`, `"max titanium creatina 300g"`
- **Títulos específicos** (fixar 1 na posição 1): `Creatina Max Titanium 300g`, `Max Titanium: Nota e Preço`; demais títulos e descrições = conjunto padrão de produto (abaixo)

#### Creatina - Black Skull

- **Destino**: `/creatina/black-skull-creatina-300g`
- **CPC máx.**: R$ 0,50
- **Palavras-chave**: `[creatina black skull]`, `"creatina black skull 300g"`, `"creator black skull"`
- **Títulos específicos** (fixar 1 na posição 1): `Creatina Black Skull 300g`, `Black Skull: Nota e Preço`; demais títulos e descrições = conjunto padrão de produto (abaixo)

#### Creatina - Probiotica

- **Destino**: `/creatina/probiotica-creatina-300g`
- **CPC máx.**: R$ 0,50
- **Palavras-chave**: `[creatina probiotica]`, `"creatina probiotica 300g"`
- **Títulos específicos** (fixar 1 na posição 1): `Creatina Probiótica 300g`, `Probiótica: Nota e Preço`; demais títulos e descrições = conjunto padrão de produto (abaixo)

#### Creatina - Atlhetica

- **Destino**: `/creatina/atlhetica-creatina-300g`
- **CPC máx.**: R$ 0,50
- **Palavras-chave**: `[creatina atlhetica]`, `"creatina atlhetica 300g"`, `"atlhetica creatina 100 pure"`
- **Títulos específicos** (fixar 1 na posição 1): `Creatina Atlhetica 300g`, `Atlhetica: Nota e Preço`; demais títulos e descrições = conjunto padrão de produto (abaixo)

#### Creatina - Optimum Nutrition

- **Destino**: `/creatina/optimum-nutrition-creatine-300g`
- **CPC máx.**: R$ 0,50
- **Palavras-chave**: `[creatina optimum nutrition]`, `"creatina optimum nutrition 300g"`, `"creatina micronizada optimum"`
- **Títulos específicos** (fixar 1 na posição 1): `Creatina Optimum 300g`, `Optimum: Nota e Preço`; demais títulos e descrições = conjunto padrão de produto (abaixo)

### Campanha `SS | Search | Outros PA | Teste`

#### Pre-treino - Horus

- **Destino**: `/categorias/pre-treino/max-titanium-horus-300g`
- **CPC máx.**: R$ 0,50
- **Palavras-chave**: `[horus max titanium]`, `"pre treino horus"`, `"horus 300g"`
- **Títulos específicos** (fixar 1 na posição 1): `Horus 300g: Nota e Preço`, `Pré-Treino Horus 300g`; demais títulos e descrições = conjunto padrão de produto (abaixo)

#### Pre-treino - Evora

- **Destino**: `/categorias/pre-treino/darkness-evora-pw-limao-150g`
- **CPC máx.**: R$ 0,50
- **Palavras-chave**: `[evora darkness]`, `"pre treino evora"`, `"evora pw"`
- **Títulos específicos** (fixar 1 na posição 1): `Évora PW 150g: Nota e Preço`, `Pré-Treino Évora 150g`; demais títulos e descrições = conjunto padrão de produto (abaixo)

#### Glutamina - Integralmedica

- **Destino**: `/categorias/glutamina/integralmedica-glutamina-300g`
- **CPC máx.**: R$ 0,50
- **Palavras-chave**: `[glutamina integralmedica]`, `"glutamina integralmedica 300g"`, `[glutamina 300g]`
- **Títulos específicos** (fixar 1 na posição 1): `Glutamina Integralmédica`, `Glutamina 300g: Nota e Preço`; demais títulos e descrições = conjunto padrão de produto (abaixo)

#### BCAA - Max Titanium

- **Destino**: `/categorias/bcaa/max-titanium-bcaa-2400-100-capsulas`
- **CPC máx.**: R$ 0,50
- **Palavras-chave**: `[bcaa max titanium]`, `"bcaa 2400 max titanium"`, `"bcaa max titanium 100 capsulas"`
- **Títulos específicos** (fixar 1 na posição 1): `BCAA Max Titanium 2400`, `BCAA 100 Cáps: Nota e Preço`; demais títulos e descrições = conjunto padrão de produto (abaixo)

#### Melatonina - Neo Quimica (PAUSADO) — ⏸️ PAUSADO

- **Destino**: `/categorias/melatonina/neo-quimica-melatonina-021mg-90-comprimidos`
- **CPC máx.**: R$ 0,40
- **Palavras-chave**: `[melatonina neo quimica]`, `"melatonina neo quimica 90"`
- **Títulos específicos** (fixar 1 na posição 1): `Melatonina Neo Química 90`, `Melatonina: Nota e Preço`; demais títulos e descrições = conjunto padrão de produto (abaixo)

### Conjunto padrão dos grupos de produto

Usado em todos os grupos exceto `Creatina - comparacao`, somado aos 2 títulos específicos de cada grupo.

**Títulos** (10):

- Compare Antes de Comprar (24)
- Preço por Dose Calculado (24)
- Nota e Custo-Benefício (22)
- Critérios Públicos (18)
- Grátis e Sem Cadastro (21)
- Veja o Preço Atual (18)
- Compare Com Outras Marcas (25)
- Metodologia Aberta (18)
- Siga Direto Para a Oferta (25)
- Avaliação Com Dados Reais (25)

**Descrições** (4):

- Veja nota, preço por dose e custo-benefício deste produto antes de comprar. (75)
- Compare com opções parecidas e siga para a loja em um clique. Grátis. (69)
- Avaliação com critérios públicos e preço capturado em loja real. (64)
- Descubra se o preço de hoje compensa e compare com outras marcas. (65)

### Regras de redação aplicadas

- **Nenhum claim de saúde ou resultado**: nada de "ganho de massa",
  "força", "energia", "recuperação", "dormir melhor", "resultado
  garantido". Os textos falam só de comparação, preço, nota e
  metodologia, que é o que o SupleScore faz.
- **Nenhum preço no anúncio**: os preços da Amazon mudam, e anúncio com
  preço desatualizado é reprovado ou vira reclamação. O preço fica na
  página.
- **Nenhum superlativo não verificável** ("o menor preço", "o melhor").
  "Melhor creatina" aparece só como palavra-chave, não no texto.
- **Nenhum nome de loja no texto** (Amazon ou Mercado Livre). O texto diz
  "siga para a loja" / "oferta".

### Marca registrada: cautela

- **Palavras-chave com marca** (Max Titanium, Black Skull, Probiótica,
  Atlhetica, Optimum Nutrition, Integralmédica, Darkness): o Google
  permite marca de terceiro como palavra-chave no Brasil, mas o titular
  pode registrar reclamação.
- **Marca no texto do anúncio**: só nos 2 títulos específicos de cada
  grupo de produto, sempre descrevendo o produto avaliado ("Creatina Max
  Titanium 300g", "Max Titanium: Nota e Preço"), uso informativo de site
  de avaliação. Nunca simular a loja oficial, nunca usar "oficial" e nunca
  usar logo.
- **Se um anúncio for limitado/reprovado por "Marcas registradas"**:
  remover os 2 títulos com marca daquele grupo. O anúncio continua com o
  conjunto padrão, sem marca (10 títulos). Não recorrer nem insistir.
- **Extensão de snippet estruturado com lista de marcas**: não incluída
  de propósito (lista de marcas de terceiros = mais exposição a
  reclamação sem ganho claro).

## 6. Palavras negativas (resumo; lista completa em `negative-keywords.csv`)

| Nível                         | Exemplos                                                                                                                                                                                                                                     | Por quê                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Lista compartilhada (ambas)   | `gratis`, `como tomar`, `para que serve`, `beneficios`, `faz mal`, `efeitos colaterais`, `rins`, `queda de cabelo`, `emagrecer`, `gravida`, `bula`, `anvisa`, `pdf`, `estudo`, `atacado`, `revenda`, `vagas`, `reclame aqui`, `perto de mim` | informacional, saúde (evita casar anúncio com dúvida médica), B2B, vaga, suporte, loja física |
| Lista compartilhada (ambas)   | `mercado livre`, `shopee`, `magalu`, `americanas`, `netshoes`, `centauro`, `drogasil`, `droga raia`                                                                                                                                          | a pessoa já escolheu uma loja que não é a do clique                                           |
| Campanha Creatina             | `capsula(s)`, `gummy`, `goma`, `1kg`, `500g`, `100g`, `150g`, `hcl`, `kre alkalyn`, `creapure`, `cavalo`, `growth`, `integralmedica`, `dux`, `vitafor`, `darkness`                                                                           | formato, tamanho, tipo ou marca que a vitrine não tem hoje                                    |
| Grupo `Creatina - comparacao` | `max titanium`, `black skull`, `probiotica`, `atlhetica`, `optimum`                                                                                                                                                                          | busca de marca vai para o grupo daquela marca                                                 |
| Campanha Outros               | `sem cafeina`, `natural`, `pressão alta`, `hipertenso`, `dmaa`, `proibido`, `insonia`, `dormir`, `sono`, `ansiedade`                                                                                                                         | produto não atende, saúde, regulatório                                                        |

**`amazon` não é negativa** de propósito: quem busca "creatina max
titanium amazon" quer comprar exatamente onde o clique vai terminar.

## 7. Assets (extensões)

- **Sitelinks**: Ranking de Creatina (`/creatina`), Ofertas do Catálogo
  (`/ofertas`), Como Avaliamos (`/metodologia`), Como Ganhamos Dinheiro
  (`/como-ganhamos-dinheiro`, transparência sobre afiliado). Os 4
  retornam 200, conferido em 29/09.
- **Frases de destaque**: Grátis e Sem Cadastro · Preço por Dose ·
  Critérios Públicos · Nota de 0 a 100.

## 8. URLs de destino e UTM

- **Destino sempre no SupleScore**, nunca link direto para Amazon ou
  Mercado Livre (o clique para a loja passa pelo `/go`, que aplica a tag
  e registra `outbound_clicks`).
- **Template de rastreamento** (nível campanha, já em `campaigns.csv`):

```
{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign=ss_creatina_teste_pa&utm_content={adgroupid}&utm_term={keyword}
{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign=ss_outros_teste_pa&utm_content={adgroupid}&utm_term={keyword}
```

- **Auto-tagging (`gclid`) ligado.**
- Antes de ativar, use "Testar" no template dentro do Google Ads e
  confira que a URL final abre em 200. As páginas de produto do Next
  aceitam querystring sem quebrar, e o canonical continua limpo (sem UTM).
- O `source` do `/go` (`product-page`, `ranking`...) é gerado pelo site e
  **não** carrega a UTM. A ligação anúncio → clique de saída é pela
  janela de tempo (§0.1).

## 9. Métricas de sucesso

| Métrica                                                                                          | Onde medir                                              | Bom                 | Aceitável                           | Ruim                                                          |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | ------------------- | ----------------------------------- | ------------------------------------------------------------- |
| CTR (palavras exatas)                                                                            | Google Ads                                              | ≥ 5%                | 3–5%                                | < 2%                                                          |
| CPC médio                                                                                        | Google Ads                                              | ≤ R$ 0,40           | R$ 0,40–0,70                        | > R$ 0,70                                                     |
| **Taxa de saída afiliada** = cliques `/go` afiliados (`source` ≠ `unknown`) ÷ cliques do anúncio | `outbound_clicks` + Google Ads                          | ≥ 40%               | 20–40%                              | < 15%                                                         |
| **Custo por clique afiliado** = gasto ÷ cliques `/go` afiliados                                  | idem                                                    | ≤ R$ 1,00           | R$ 1,00–2,50                        | > R$ 2,50                                                     |
| Pedidos no período                                                                               | Amazon Associates (relatório por dia, atraso de 24–48h) | ≥ 1 pedido no teste | cliques na Amazon batendo com `/go` | cliques na Amazon ≈ 0 com `/go` > 0 (tag/atribuição quebrada) |
| **EPC** = ganhos Amazon ÷ cliques do anúncio                                                     | Associates + Google Ads                                 | ≥ CPC               | ≥ 30% do CPC                        | < 10% do CPC                                                  |

**Métrica que decide o dia 7**: taxa de saída afiliada e custo por
clique afiliado. Com R$ 100, o número de pedidos vai ser pequeno demais
para decidir por ROI. Pedidos servem para confirmar que o funil converte,
não para medir retorno.

## 10. Regras de pausa e corte

| Gatilho                                                                                 | Ação                                                                                                 |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Gasto total do teste chega a **R$ 100**                                                 | **Pausar as 2 campanhas.** Fim do teste                                                              |
| Palavra-chave com **≥ R$ 8 gastos** (~10+ cliques) e **0 clique `/go`** no produto dela | Pausar a palavra                                                                                     |
| Palavra-chave com **CTR < 1% após 200 impressões**                                      | Pausar a palavra                                                                                     |
| Grupo com **≥ 20 cliques** e taxa de saída afiliada **< 15%**                           | Pausar o grupo e revisar a página de destino                                                         |
| **Dia 3**: ≥ 30 cliques no total e **0** clique `/go` afiliado                          | **Pausar tudo** e investigar (provável quebra de `/go`, página ou rastreamento) antes de gastar mais |
| Termo de pesquisa irrelevante no relatório                                              | Adicionar como negativa no mesmo dia                                                                 |
| Produto **indisponível na Amazon** ou preço **> 15% acima** do exibido no SupleScore    | Pausar o grupo daquele produto até recapturar                                                        |
| Página de destino deixa de responder 200 (produto despublicado vira 404)                | Pausar o grupo na hora                                                                               |
| Anúncio reprovado por **marca registrada**                                              | Remover os títulos com marca (§5), não recorrer                                                      |
| Anúncio reprovado por **saúde/suplemento**                                              | Pausar o grupo e reportar; não reescrever com outro claim                                            |

## 11. Acompanhamento: dias 1 a 7

**Todo dia (10–15 min):**

1. Google Ads, **Termos de pesquisa**: negativar o que não é compra.
2. Google Ads: gasto acumulado (teto R$ 100), CTR e CPC por grupo.
3. Cliques de saída no banco (só leitura):

```sql
SELECT date_trunc('day', oc."createdAt") AS dia,
       p.slug, oc.source, oc."wasAffiliate", count(*)
FROM outbound_clicks oc
JOIN products p ON p.id = oc."productId"
WHERE oc."createdAt" >= '<data de início>'
  AND oc.source <> 'unknown'
GROUP BY 1, 2, 3, 4
ORDER BY 1, 5 DESC;
```

(Ou `GET /api/admin/metrics` com `x-api-key`, que dá total, afiliado e
por loja.)

4. Amazon Associates, relatório diário: cliques, pedidos e ganhos
   (atraso de 24–48h, o dia 1 só aparece no dia 2 ou 3).
5. Conferir que os 10 destinos respondem 200 e que o `/go` de cada um
   segue com `tag=suplescore-20`.

**Dia 3, primeiro checkpoint:**

- Aplicar a regra de "0 clique `/go` com ≥ 30 cliques".
- Se o CPC médio passar de R$ 0,70: baixar os lances em 20% ou tirar as
  palavras de frase mais caras.
- Se a campanha Creatina não gasta nem R$ 5/dia (volume baixo): subir o
  CPC do grupo genérico para R$ 0,90. Não adicionar correspondência ampla.

**Dia 4:**

- Rever por dispositivo. Se o celular tiver taxa de saída afiliada muito
  menor que o desktop (ou o contrário), ajustar em −30% o pior.
- Rever horário: se a madrugada já estiver cortada e ainda houver faixa
  sem nenhum clique `/go`, reduzir.

**Dia 7, decisão:**

| Resultado                                                             | Decisão                                                                                                                      |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Taxa de saída ≥ 40%, custo por clique afiliado ≤ R$ 1,00 e ≥ 1 pedido | Manter mais 7 dias com o mesmo orçamento; **priorizar ligar o GA4 com evento de conversão** (§0.1) antes de qualquer aumento |
| Taxa de saída entre 20% e 40%, sem pedido                             | Manter só os grupos com melhor taxa, cortar o resto e reavaliar em mais 7 dias com R$ 10/dia                                 |
| Taxa de saída < 20% ou custo por clique afiliado > R$ 2,50            | **Encerrar a mídia paga**; o problema é página/oferta, não campanha                                                          |
| 0 clique na Amazon com cliques `/go` > 0                              | Parar e investigar a atribuição/tag antes de qualquer coisa                                                                  |

## 12. Checklist antes de ativar (tudo manual, fora deste repositório)

- [ ] Revisar este plano e os CSVs
- [ ] Conferir a taxa real de comissão de suplementos no portal Amazon
      Associates e refazer a conta do §0.2
- [ ] Recapturar os preços dos 10 produtos se passaram mais de 3 dias
      desde 29/09 (`prisma/recaptureVitrinePrices.ts`), sobretudo os
      descontos grandes (Black Skull Creator, Max Titanium Creatina, ON)
- [ ] Conferir que os 10 destinos respondem 200 e o `/go` de cada um é
      afiliado
- [ ] Importar no Google Ads Editor **com as campanhas pausadas**, revisar
      a prévia dos anúncios e só então ativar
- [ ] Configurar o limite de gasto da conta ou um lembrete para parar em
      R$ 100
- [ ] Anotar a data e hora de início (necessárias para a atribuição por
      janela, §0.1)

---

O rascunho anterior `work/google-ads-first-commission/` (não versionado,
09/09) está **desatualizado**: ele direciona tráfego para Growth Creatina
e Growth Whey, que saíram da vitrine em 29/09 por ASIN indisponível, e
assume "0 produtos monetizados". Não usar.
