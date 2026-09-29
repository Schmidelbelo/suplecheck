# Recaptura de preços da vitrine monetizada (2026-09-29)

Escopo: somente os 16 produtos visíveis de
`docs/VITRINE_MONETIZAVEL_2026-09-29.md`. Nenhum produto despublicado foi
republicado, nenhum produto novo foi adicionado e nenhum afiliado ou
imagem foi alterado. Bloqueados, ambíguos, `affiliate-discovery` e o
schema também ficaram intactos.

## Método

- **Fonte**: listagem de ofertas da própria Amazon para cada ASIN
  (`/gp/product/ajax/aodAjaxMain/?asin=<ASIN>`). A página `/dp/` esconde
  o preço de visitante anônimo ("adicione este item ao carrinho para ver
  os detalhes"), mas a listagem mostra a **oferta em destaque** (buy box)
  com preço, vendedor e envio.
- **Preço gravado**: o preço a pagar da oferta em destaque. O "De:" de
  referência, o preço por unidade e os cupons de primeira compra não
  entram. Sem oferta em destaque mas com vendedores ativos, foi gravada a
  menor oferta "Novo".
- **Escrita**: `prisma/recaptureVitrinePrices.ts` cria uma `PriceEntry`
  nova (append-only) com a mesma `url`/loja/`affiliateUrl` da captura
  anterior e `availability=IN_STOCK`. Antes de gravar, confere que a
  oferta atual ainda é `amazon-br/dp/<ASIN esperado>`. Commit `8305983`.

## ✅ Atualizados (12)

| Produto                                       | ASIN       | Antes     | Agora         | Oferta                                                                     |
| --------------------------------------------- | ---------- | --------- | ------------- | -------------------------------------------------------------------------- |
| `max-titanium-bcaa-2400-100-capsulas`         | B076X8666Y | R$ 40,71  | **R$ 51,99**  | destaque, vendido e enviado pela Amazon                                    |
| `atlhetica-creatina-300g`                     | B07MPZLM1N | R$ 47,90  | **R$ 38,16**  | destaque                                                                   |
| `black-skull-creatina-300g`                   | B09MJK3PMB | R$ 59,90  | **R$ 28,40**  | destaque, Black Skull USA Oficial (De: R$ 49,90)                           |
| `max-titanium-creatina-300g`                  | B07DVJC66X | R$ 54,90  | **R$ 33,37**  | destaque, Amazon                                                           |
| `optimum-nutrition-creatine-300g`             | B07774XR8W | R$ 129,90 | **R$ 87,21**  | destaque, Versalius (De: R$ 155,25)                                        |
| `probiotica-creatina-300g`                    | B07G7JPTCV | R$ 44,90  | **R$ 38,09**  | destaque, FITHOUSE, enviado pela Amazon                                    |
| `integralmedica-glutamina-300g`               | B07L5X6FSQ | R$ 44,63  | **R$ 49,90**  | destaque, Amazon                                                           |
| `neo-quimica-melatonina-021mg-90-comprimidos` | B0B5S7L3VN | R$ 23,60  | **R$ 15,00**  | destaque, Strafit Nutrition                                                |
| `darkness-evora-pw-limao-150g`                | B09C81ML7Z | R$ 47,67  | **R$ 59,44**  | destaque, Amazon                                                           |
| `max-titanium-horus-300g`                     | B09B1B9QBP | R$ 63,26  | **R$ 75,04**  | destaque, HotBody Suplementos, enviado pela Amazon                         |
| `probiotica-100-pure-whey-900g`               | B0BKQSX5CF | R$ 140,19 | **R$ 147,73** | ⚠️ **sem oferta em destaque**, menor de 7 ofertas                          |
| `black-skull-whey-protein-concentrado-900g`   | B0G6WYK4B3 | R$ 219,90 | **R$ 170,90** | ⚠️ **sem oferta em destaque**, 1 vendedor, frete R$ 10,35, entrega 6–7/out |

## ⏸️ Não atualizado (1), continua visível

| Produto                                                  | Motivo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `growth-oleo-de-peixe-ultra-75-capsulas` (Mercado Livre) | O Mercado Livre redireciona acesso automatizado para `account-verification` (verificação anti-bot) e a API pública de produto exige autenticação (`401`). Não foi possível ler o preço atual sem contornar a verificação, e ela não foi contornada. **Preço mantido** (R$ 36,90, capturado em 2026-09-17), sem inventar valor. O link afiliado `meli.la/2jWrJqm` segue válido e o `/go` segue afiliado, então o produto continua na vitrine. **Conferir o preço à mão antes de pôr verba nele.** |

## ❌ Removidos por falha crítica (3)

Nas 2 leituras feitas (página `/dp/` e listagem de ofertas, a segunda
repetida para descartar resultado transitório), os três mostram "Não
disponível", sem oferta em destaque e sem nenhum outro vendedor. Não há
preço real para gravar, e o clique levaria a uma página onde não dá para
comprar. Foram despublicados (`PUBLISHED` para `UNPUBLISHED`, sem apagar
nada) via `prisma/unpublishUnavailableAmazon.ts`, commit `d3346cd`.

| Produto                                     | ASIN       |
| ------------------------------------------- | ---------- |
| `integralmedica-omega-3-1360mg-60-capsulas` | B081VQZ1YK |
| `growth-creatina-monohidratada-250g`        | B0CJG32CZ6 |
| `growth-whey-protein-concentrado-900g`      | B0H8LTG86T |

Voltam quando o ASIN tiver oferta de novo: recapturar o preço e voltar o
status.

## Validação em produção

| Verificação                                                                | Resultado                                                                 |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `/ofertas`, `/creatina`, `/categorias/whey-protein`, `/categorias/omega-3` | `200`, 0 produtos despublicados no HTML                                   |
| 13 páginas de produto visíveis                                             | 13/13 `200`, com o preço novo na página                                   |
| `/go` dos 13 visíveis                                                      | 13/13 `302` afiliado (12 `?tag=suplescore-20`, 1 `meli.la`)               |
| Tracking                                                                   | 13 cliques de validação, **13/13 `wasAffiliate=true`** (`source=unknown`) |
| 46 produtos despublicados (43 anteriores + 3 de hoje)                      | 46/46 `404`                                                               |
| `sitemap-produtos.xml`                                                     | 13 URLs, 0 despublicados                                                  |
| `sitemap-comparacoes.xml`                                                  | 12 URLs, 0 despublicados                                                  |

## Lista final pronta para tráfego pago (13 visíveis)

**Prioridade A**: oferta em destaque na Amazon, preço de hoje, clique vai
direto para uma página com "Adicionar ao carrinho".

| #   | Produto                           | Destino do anúncio                                                   | Preço                                              |
| --- | --------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | Max Titanium Creatina 300g        | `/creatina/max-titanium-creatina-300g`                               | R$ 33,37                                           |
| 2   | Black Skull Creator 300g          | `/creatina/black-skull-creatina-300g`                                | R$ 28,40                                           |
| 3   | Probiótica Creatina 300g          | `/creatina/probiotica-creatina-300g`                                 | R$ 38,09                                           |
| 4   | Atlhetica Creatina 100% Pure 300g | `/creatina/atlhetica-creatina-300g`                                  | R$ 38,16                                           |
| 5   | Optimum Nutrition Creatina 300g   | `/creatina/optimum-nutrition-creatine-300g`                          | R$ 87,21                                           |
| 6   | Max Titanium Horus 300g           | `/categorias/pre-treino/max-titanium-horus-300g`                     | R$ 75,04 (sabor pré-selecionado: frutas vermelhas) |
| 7   | Darkness Évora PW Limão 150g      | `/categorias/pre-treino/darkness-evora-pw-limao-150g`                | R$ 59,44                                           |
| 8   | Integralmédica Glutamina 300g     | `/categorias/glutamina/integralmedica-glutamina-300g`                | R$ 49,90                                           |
| 9   | Max Titanium BCAA 2400 100 cáps   | `/categorias/bcaa/max-titanium-bcaa-2400-100-capsulas`               | R$ 51,99                                           |
| 10  | Neo Química Melatonina 90         | `/categorias/melatonina/neo-quimica-melatonina-021mg-90-comprimidos` | R$ 15,00                                           |

Destino agrupado: `/creatina`, que hoje lista só as 5 creatinas acima,
todas prioridade A.

**Prioridade B**: monetizado, mas com ressalva. Não usar como destino
principal de campanha.

| Produto                                      | Ressalva                                                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Probiótica 100% Pure Whey 900g, R$ 147,73    | Amazon sem oferta em destaque: o usuário cai numa página sem botão de compra direto e precisa abrir "ver todas as opções" |
| Black Skull Whey 80% HD 900g, R$ 170,90      | sem oferta em destaque, 1 vendedor, frete pago, entrega em 7+ dias                                                        |
| Growth Óleo de Peixe Ultra 75 cáps, R$ 36,90 | preço não recapturado hoje (bloqueio anti-bot do Mercado Livre); conferir à mão antes                                     |

**Atenção**: preço de Amazon muda com frequência, especialmente os
descontos grandes (Black Skull Creator −43%, Max Titanium Creatina −31%,
ON −44% sobre o "De:"). Recapturar antes de cada ciclo de campanha,
rodando de novo o método acima com os valores novos no script.
