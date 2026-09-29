# Vitrine monetizável — classificação de receita (2026-09-29)

**Prioridade: receita primeiro.** Todo produto `PUBLISHED` foi
classificado pela capacidade de gerar comissão **hoje**, reproduzindo
exatamente a lógica do `/go` (`resolveOutboundClick`: 1º SKU `ACTIVE` →
`PriceEntry` mais recente → `affiliateUrl` da oferta, ou
`Store.affiliateBaseUrl`). Levantamento feito direto contra produção.

Contexto considerado:

- Amazon Associates: situação fiscal **CONCLUÍDO**; `amazon-br` com
  `isAffiliate=true`, `affiliateBaseUrl="tag=suplescore-20"`.
- Mercado Livre: afiliado por oferta (`PriceEntry.affiliateUrl` com
  `meli.la`) validado antes; a loja em si continua `isAffiliate=false`,
  então só monetiza oferta com deeplink gerado no painel.
- Netshoes/Rakuten: rejeitado permanentemente — não usado.

## Regras aplicadas

- **Amazon**: só conta como monetizável com URL `/dp/<ASIN>` na loja
  `amazon-br`. URL de busca (`/s?k=`) = ambíguo, não conta.
- **ASINs reconferidos hoje (2026-09-29)**: as 15 páginas `/dp/`
  respondem 200 e o título bate com marca/linha/tamanho do catálogo:

| ASIN       | Título na Amazon (hoje)                                             |
| ---------- | ------------------------------------------------------------------- |
| B076X8666Y | BCAA 2400 - 100 Cápsulas - Max Titanium                             |
| B07MPZLM1N | Creatina 100% Pure em Pó 300g, Atlhetica Nutrition                  |
| B09MJK3PMB | Creator - 300G, Black Skull                                         |
| B0CJG32CZ6 | Creatina Growth Monohidratada 250g Original                         |
| B07DVJC66X | MAX TITANIUM CREATINA 300 GR MONOHIDRATADA                          |
| B07774XR8W | Optimum Nutrition Creatina Monohidratada Micronizada Sem Sabor 300g |
| B07G7JPTCV | Probiótica Creatina Monohidratada - 300G                            |
| B07L5X6FSQ | Integralmedica - Glutamina Natural Isolada em Pó - 300g             |
| B0B5S7L3VN | Suplemento Alimentar Melatonina Neo Química 90 cápsulas             |
| B081VQZ1YK | Integralmedica Ômega 3 Ultraconcentrado 1360mg                      |
| B09C81ML7Z | Darkness - Evora Pré-Treino Limão                                   |
| B09B1B9QBP | Max Titanium Horus (300G) - Frutas Vermelhas                        |
| B0G6WYK4B3 | Black Skull Whey 80% HD 900g Morango                                |
| B0H8LTG86T | Whey Protein Concentrado 100% Growth Supplements 900g - Chocolate   |
| B0BKQSX5CF | 100% Pure Whey (900g), Chocolate, Probiótica                        |

Quatro ASINs caem num sabor específico (Horus, Black Skull Whey, Growth
Whey, Probiótica Pure Whey) enquanto o catálogo descreve a linha sem
sabor. **Justificativa para manter**: é o mesmo produto (marca, linha,
tamanho) e a página da Amazon oferece o seletor de sabor; o risco é de
sabor pré-selecionado, não de produto errado. Mesmo que o usuário troque
de item, a tag vale para o carrinho inteiro por 24h.

- **Mercado Livre**: só monetizável com `affiliateUrl` `meli.la` gerado
  no painel para aquela oferta exata.
- **Bloqueado / Não monetizável / Ambíguo**: sai da vitrine com
  `status: UNPUBLISHED`. **Nenhum dado é apagado**: produto, SKU,
  `PriceEntry`, `ProductScore`, `OutboundClick` e imagens ficam
  intactos, e voltar para a vitrine é só trocar o status de novo.

## Resultado

| Classe                                  | Qtde   | Ação                               |
| --------------------------------------- | ------ | ---------------------------------- |
| Monetizável agora — Amazon              | 15     | fica visível                       |
| Monetizável agora — Mercado Livre       | 1      | fica visível                       |
| Bloqueado por programa externo pendente | 7      | despublicar                        |
| Ambíguo / risco de link errado          | 4      | despublicar                        |
| Não monetizável agora                   | 32     | despublicar                        |
| **Total `PUBLISHED` antes**             | **59** | **16 visíveis / 43 despublicados** |

### 🟢 MONETIZÁVEL AGORA — Amazon (15)

| Produto                                       | Categoria    | Loja        | Preço     | Motivo          |
| --------------------------------------------- | ------------ | ----------- | --------- | --------------- |
| `max-titanium-bcaa-2400-100-capsulas`         | bcaa         | `amazon-br` | R$ 40,71  | ASIN B076X8666Y |
| `atlhetica-creatina-300g`                     | creatina     | `amazon-br` | R$ 47,90  | ASIN B07MPZLM1N |
| `black-skull-creatina-300g`                   | creatina     | `amazon-br` | R$ 59,90  | ASIN B09MJK3PMB |
| `growth-creatina-monohidratada-250g`          | creatina     | `amazon-br` | R$ 49,90  | ASIN B0CJG32CZ6 |
| `max-titanium-creatina-300g`                  | creatina     | `amazon-br` | R$ 54,90  | ASIN B07DVJC66X |
| `optimum-nutrition-creatine-300g`             | creatina     | `amazon-br` | R$ 129,90 | ASIN B07774XR8W |
| `probiotica-creatina-300g`                    | creatina     | `amazon-br` | R$ 44,90  | ASIN B07G7JPTCV |
| `integralmedica-glutamina-300g`               | glutamina    | `amazon-br` | R$ 44,63  | ASIN B07L5X6FSQ |
| `neo-quimica-melatonina-021mg-90-comprimidos` | melatonina   | `amazon-br` | R$ 23,60  | ASIN B0B5S7L3VN |
| `integralmedica-omega-3-1360mg-60-capsulas`   | omega-3      | `amazon-br` | R$ 119,90 | ASIN B081VQZ1YK |
| `darkness-evora-pw-limao-150g`                | pre-treino   | `amazon-br` | R$ 47,67  | ASIN B09C81ML7Z |
| `max-titanium-horus-300g`                     | pre-treino   | `amazon-br` | R$ 63,26  | ASIN B09B1B9QBP |
| `black-skull-whey-protein-concentrado-900g`   | whey-protein | `amazon-br` | R$ 219,90 | ASIN B0G6WYK4B3 |
| `growth-whey-protein-concentrado-900g`        | whey-protein | `amazon-br` | R$ 194,90 | ASIN B0H8LTG86T |
| `probiotica-100-pure-whey-900g`               | whey-protein | `amazon-br` | R$ 140,19 | ASIN B0BKQSX5CF |

### 🟢 MONETIZÁVEL AGORA — Mercado Livre (1)

| Produto                                  | Categoria | Loja            | Preço    | Motivo                                       |
| ---------------------------------------- | --------- | --------------- | -------- | -------------------------------------------- |
| `growth-oleo-de-peixe-ultra-75-capsulas` | omega-3   | `mercado-livre` | R$ 36,90 | deeplink `meli.la` por oferta já configurado |

### 🟡 BLOQUEADO — programa externo pendente (7)

| Produto                                           | Categoria      | Loja                         | Preço     | Motivo                                                                 |
| ------------------------------------------------- | -------------- | ---------------------------- | --------- | ---------------------------------------------------------------------- |
| `max-titanium-mass-titanium-17500-3kg`            | hipercaloricos | `mercado-livre`              | R$ 112,90 | Mercado Livre sem deeplink `meli.la` gerado (exige painel do afiliado) |
| `integralmedica-pre-treino-prime-md-300g`         | pre-treino     | `integralmedica-oficial`     | R$ 112,00 | Lomadee (Integralmédica) — cadastro humano pendente                    |
| `max-titanium-egide-300g`                         | pre-treino     | `max-titanium-oficial`       | R$ 109,89 | "Minha Loja Max Titanium" — modelo não confirmado/sem cadastro         |
| `dark-lab-100-whey-protein-900g`                  | whey-protein   | `dark-lab-oficial`           | R$ 179,90 | Awin (Dark Lab) — cadastro de publisher pendente                       |
| `integralmedica-whey-protein-concentrado-900g`    | whey-protein   | `integralmedica-oficial`     | R$ 240,00 | Lomadee (Integralmédica) — cadastro humano pendente                    |
| `max-titanium-100-whey-protein-900g`              | whey-protein   | `max-titanium-oficial`       | R$ 204,08 | "Minha Loja Max Titanium" — modelo não confirmado/sem cadastro         |
| `soldiers-nutrition-whey-protein-concentrado-1kg` | whey-protein   | `soldiers-nutrition-oficial` | R$ 145,90 | Awin (Soldiers) — cadastro de publisher pendente                       |

### 🟠 AMBÍGUO — risco de link errado (4)

| Produto                                 | Categoria      | Loja            | Preço     | Motivo                                               |
| --------------------------------------- | -------------- | --------------- | --------- | ---------------------------------------------------- |
| `dux-creatina-300g`                     | creatina       | `loja-oficial`  | R$ 64,90  | URL de busca genérica da Amazon, sem ASIN confirmado |
| `integralmedica-creatina-creapure-300g` | creatina       | `loja-oficial`  | R$ 79,90  | URL de busca genérica da Amazon, sem ASIN confirmado |
| `vitafor-creatina-300g`                 | creatina       | `loja-oficial`  | R$ 89,90  | URL de busca genérica da Amazon, sem ASIN confirmado |
| `integralmedica-sinister-mass-3kg`      | hipercaloricos | `mercado-livre` | R$ 110,43 | anúncio ML de origem morto; recaptura não confirmada |

### 🔴 NÃO MONETIZÁVEL agora (32)

| Produto                                          | Categoria          | Loja                        | Preço     | Motivo                                                    |
| ------------------------------------------------ | ------------------ | --------------------------- | --------- | --------------------------------------------------------- |
| `integralmedica-protein-crisp-bar-caixa-12-un`   | barras-de-proteina | `fastfit-suplementos`       | R$ 129,60 | loja `fastfit-suplementos` sem programa de afiliado       |
| `max-titanium-power-protein-bar-caixa-12-un-41g` | barras-de-proteina | `madrugao-suplementos`      | R$ 86,45  | loja `madrugao-suplementos` sem programa de afiliado      |
| `integralmedica-bcaa-2044mg-90-capsulas`         | bcaa               | `vitaminas-brasil`          | R$ 53,26  | loja `vitaminas-brasil` sem programa de afiliado          |
| `dux-cafeina-90-capsulas`                        | cafeina            | `dux-oficial`               | R$ 59,90  | loja `dux-oficial` sem programa de afiliado               |
| `growth-cafeina-100mg-120-capsulas`              | cafeina            | `essencia-brasileira`       | R$ 39,90  | loja `essencia-brasileira` sem programa de afiliado       |
| `growth-cafeina-200mg-60-capsulas`               | cafeina            | `cirurgica-estilo`          | R$ 48,97  | loja `cirurgica-estilo` sem programa de afiliado          |
| `max-titanium-fire-black-60-capsulas`            | cafeina            | `sua-saude-distribuidora`   | R$ 28,99  | loja `sua-saude-distribuidora` sem programa de afiliado   |
| `growth-coenzima-q10-100mg-60-capsulas`          | coenzima-q10       | `essencia-brasileira`       | R$ 82,30  | loja `essencia-brasileira` sem programa de afiliado       |
| `integralmedica-coq10-30-capsulas`               | coenzima-q10       | `nutri-fast-shop`           | R$ 145,90 | loja `nutri-fast-shop` sem programa de afiliado           |
| `max-titanium-colagen-100-capsulas`              | colageno           | `loja-nutrifit`             | R$ 35,00  | loja `loja-nutrifit` sem programa de afiliado             |
| `probiotica-pro-collagen-330g`                   | colageno           | `cwb-gold-suplementos`      | R$ 99,90  | loja `cwb-gold-suplementos` sem programa de afiliado      |
| `vitafor-colagentek-300g`                        | colageno           | `materia-prima-suplementos` | R$ 89,90  | loja `materia-prima-suplementos` sem programa de afiliado |
| `darkness-creatina-monohidratada-300g`           | creatina           | `darkness-oficial`          | R$ 60,00  | loja `darkness-oficial` sem programa de afiliado          |
| `max-titanium-glutamina-lg-300g`                 | glutamina          | `drogaria-minas-brasil`     | R$ 82,39  | loja `drogaria-minas-brasil` sem programa de afiliado     |
| `growth-melatonina-021mg-100-capsulas`           | melatonina         | `essencia-brasileira`       | R$ 39,10  | loja `essencia-brasileira` sem programa de afiliado       |
| `max-titanium-omega-3-90-capsulas`               | omega-3            | `mercadao-suplementos`      | R$ 32,50  | loja `mercadao-suplementos` sem programa de afiliado      |
| `vitafor-omega-3-epa-dha-120-capsulas`           | omega-3            | `vitafor-oficial`           | R$ 128,00 | loja `vitafor-oficial` sem programa de afiliado           |
| `growth-pasta-de-amendoim-integral-torrado-1kg`  | pasta-de-amendoim  | `goldstar-supplements`      | R$ 79,98  | loja `goldstar-supplements` sem programa de afiliado      |
| `nutrata-pasta-de-amendoim-pacoca-600g`          | pasta-de-amendoim  | `nutrata-oficial`           | R$ 88,00  | loja `nutrata-oficial` sem programa de afiliado           |
| `dux-pre-workout-original-300g`                  | pre-treino         | `dux-oficial`               | R$ 134,90 | loja `dux-oficial` sem programa de afiliado               |
| `probiotica-epic-pre-treino-300g`                | pre-treino         | `probiotica-oficial`        | R$ 88,89  | loja `probiotica-oficial` sem programa de afiliado        |
| `adaptogen-tasty-whey-3w-900g`                   | whey-protein       | `adaptogen-oficial`         | R$ 302,01 | loja `adaptogen-oficial` sem programa de afiliado         |
| `bodyaction-body-whey-protein-900g`              | whey-protein       | `bodyaction-oficial`        | R$ 73,60  | loja `bodyaction-oficial` sem programa de afiliado        |
| `darkness-dark-whey-protein-concentrado-900g`    | whey-protein       | `darkness-oficial`          | R$ 257,00 | loja `darkness-oficial` sem programa de afiliado          |
| `dux-whey-protein-concentrado-900g`              | whey-protein       | `fastfit-suplementos`       | R$ 249,90 | loja `fastfit-suplementos` sem programa de afiliado       |
| `new-millen-whey-100-900g`                       | whey-protein       | `new-millen-oficial`        | R$ 170,40 | loja `new-millen-oficial` sem programa de afiliado        |
| `nutrata-w100-whey-concentrado-900g`             | whey-protein       | `nutrata-oficial`           | R$ 288,00 | loja `nutrata-oficial` sem programa de afiliado           |
| `optimum-nutrition-gold-standard-whey-907g`      | whey-protein       | `brasilfitsuplementos`      | R$ 394,90 | loja `brasilfitsuplementos` sem programa de afiliado      |
| `probiotica-hiper-100-whey-900g`                 | whey-protein       | `probiotica-oficial`        | R$ 115,00 | loja `probiotica-oficial` sem programa de afiliado        |
| `vitafor-whey-protein-concentrado-900g`          | whey-protein       | `vitafor-oficial`           | R$ 184,00 | loja `vitafor-oficial` sem programa de afiliado           |
| `growth-zma-ultra-120-comprimidos`               | zma                | `gsuplementos`              | R$ 69,90  | loja `gsuplementos` sem programa de afiliado              |
| `max-titanium-zma-90-capsulas`                   | zma                | `nutri-fast-shop`           | R$ 59,90  | loja `nutri-fast-shop` sem programa de afiliado           |

## Como destravar os bloqueados (ações humanas, fora do código)

1. **Mercado Livre — `max-titanium-mass-titanium-17500-3kg`**: abrir a
   URL já capturada (`/p/MLB18724697`) logado no painel de afiliados,
   clicar em "Compartilhar", seguir `docs/PROCEDIMENTO_AFILIADO_MERCADO_LIVRE.md`
   e republicar. Atenção: a página de origem é "sabor morango" e o
   catálogo não especifica sabor.
2. **Lomadee (Integralmédica)**: cadastro destrava
   `integralmedica-whey-protein-concentrado-900g` e
   `integralmedica-pre-treino-prime-md-300g`.
3. **Awin (Dark Lab, Soldiers)**: cadastro de publisher destrava 1
   produto de cada.
4. **Max Titanium "Minha Loja"**: precisa decidir se o modelo de
   vitrine funciona com o `/go` antes de cadastrar.
5. **Não monetizáveis**: o caminho mais rápido é recapturar o mesmo
   produto na Amazon com ASIN confirmado em navegador real (por exemplo
   `integralmedica-creatina-creapure-300g`, Dux/Vitafor creatina, as
   linhas de whey das marcas oficiais) e republicar.
