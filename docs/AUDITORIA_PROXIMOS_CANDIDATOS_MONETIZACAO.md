# Próximos candidatos seguros para monetização/correção de URL

Levantamento **só leitura** contra produção, 2026-09-18 — continuação
das frentes de `docs/AUDITORIA_OPORTUNIDADES_MONETIZACAO.md` (correção
das 6 URLs genéricas da Amazon, 5 resolvidas) e
`docs/PROCEDIMENTO_AFILIADO_MERCADO_LIVRE.md` (Mercado Livre por
oferta, 1 configurada, 2 esgotadas). Objetivo: encontrar a próxima
leva de candidatos, sem configurar nada agora.

**Nada foi alterado.** Nenhum `affiliateUrl`, catálogo, banco, imagem,
ranking, código, schema ou `affiliate-discovery` tocado — só consulta
a `Product`/`Sku`/`PriceEntry`/`Store` já existentes, mais busca web
para levantar evidência.

---

## 1. Panorama

59 produtos `PUBLISHED`, 62 ofertas (`PriceEntry` mais recente por
SKU). Cruzando por loja:

- **15 ofertas já em `amazon-br`** (`isAffiliate: true`,
  `affiliateBaseUrl` configurado) — já monetizadas automaticamente,
  incluindo as 5 corrigidas em 2026-09-17. Nenhuma ação nova necessária
  aqui.
- **1 oferta em `mercado-livre`** com `affiliateUrl` configurado
  (Growth Óleo de Peixe) — já resolvida.
- **1 oferta em `mercado-livre`** sem `affiliateUrl`
  (`integralmedica-sinister-mass-3kg`) — já descartada (anúncio morto,
  ver auditoria anterior).
- **1 oferta em `mercado-livre`** sem `affiliateUrl`
  (`max-titanium-mass-titanium-17500-3kg`) — já descartada (sabor
  ambíguo, ver auditoria anterior).
- **44 ofertas em lojas próprias de marca ou revendedores sem programa
  de afiliado confirmado** (`isAffiliate: false`) — nenhuma delas é
  candidato hoje; ver §4.
- **4 ofertas com URL de busca genérica da Amazon
  (`amazon.com.br/s?k=...`), mas atribuídas a uma loja que NÃO é
  `amazon-br`** — esta é a única frente nova real encontrada. Ver §2.

Não existe nenhum candidato novo de Mercado Livre: confirmado que
continuam sendo só as 3 ofertas já conhecidas (1 configurada, 2
descartadas) — nenhum outro produto do catálogo tem `PriceEntry.url`
apontando para `mercadolivre.com.br`.

## 2. Frente Amazon — ofertas mal atribuídas (loja errada + URL genérica)

Mesmo padrão já corrigido em 2026-09-17 (6 URLs de busca genérica),
mas com uma complicação adicional: estas 4 estão com `storeId`
apontando para uma loja **diferente** de `amazon-br`, mesmo a URL
sendo da Amazon — corrigir exige trocar `url` **e** `storeId` (não só
`url`).

| Produto                                 | Loja atual                                            | `isAffiliate` atual           | Preço capturado | Risco                        |
| --------------------------------------- | ----------------------------------------------------- | ----------------------------- | --------------- | ---------------------------- |
| `probiotica-creatina-300g`              | ✅ `amazon-br` (corrigido 2026-09-18, era `netshoes`) | `true`, `affiliateBaseUrl` OK | R$44,90         | 🟢 **Corrigido**             |
| `integralmedica-creatina-creapure-300g` | `loja-oficial`                                        | `false`                       | R$79,90         | 🟡 **Médio**                 |
| `dux-creatina-300g`                     | `loja-oficial`                                        | `false`                       | R$64,90         | 🟡 **Médio**                 |
| `vitafor-creatina-300g`                 | `loja-oficial`                                        | `false`                       | R$89,90         | 🔴 **Alto — não configurar** |

Todas as 4 compartilham `attributes: null` no cadastro (nenhum sabor
registrado) — mesmo sinal de qualidade de dado mais fraco que os
produtos já corrigidos tinham antes da correção.

### `probiotica-creatina-300g` — 🟢 baixo risco — ✅ CORRIGIDO (2026-09-18)

Busca web confirma uma única linha real na Amazon: **"Creatina
Monohidratada Pura 300g"** (múltiplos ASINs — `B07G7JPTCV`,
`B0F1ZGT7CH`, `B07M6V6WQF` — mas todos a mesma linha/composição,
diferença aparente é só vendedor/embalagem, não produto distinto).
Nenhuma variante de sabor ou linha concorrente encontrada. Hoje está
em `netshoes`, que **não tem caminho de monetização real** (rejeição
permanente já documentada) — mover para `amazon-br` com URL de
produto real destrava monetização que hoje não existe, não é só
"melhorar" uma que já funciona.

**Validação manual dedicada** (extensão Claude in Chrome indisponível
nesta sessão — validado via `WebFetch`/`WebSearch` real contra a
Amazon, mesmo padrão usado quando o navegador não estava acessível em
tarefas anteriores):

| Critério                                         | Resultado                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Produto exato: Probiótica Creatina 300g       | ✅ confirmado — título da página `dp/B07G7JPTCV`: **"Probiótica Creatina Monohidratada - 300G"**, marca Probiótica                                                                                                                                                                                 |
| 2. Linha única, sem variação obrigatória ambígua | ✅ site oficial da marca (`probiotica.com.br/creatina-300g/p`) confirma **uma única linha "Creatina Monohidratada Pura"** — sem linha concorrente tipo Creapure/Creafort que existe em outros candidatos (Vitafor)                                                                                 |
| 3. Peso 300g                                     | ✅ confirmado na página do produto e no site oficial                                                                                                                                                                                                                                               |
| 4. Sabor/sem sabor compatível                    | ✅ produto é creatina pura, sem sabor — nenhuma tabela de especificação lista variante de sabor, compatível com o cadastro (`attributes: null`)                                                                                                                                                    |
| 5. Loja/oferta atual                             | `netshoes`, `isAffiliate: true` mas `affiliateBaseUrl: null` — **sem monetização real hoje** (Netshoes rejeitada permanentemente, `docs/LOG_OPERACIONAL.md` 2026-09-17)                                                                                                                            |
| 6. URL específica ou genérica                    | ❌ genérica desde a primeira captura (`amazon.com.br/s?k=Probiótica+Creatina+300g`, 2026-09-02) — mesmo padrão do caso Nutrata (nunca foi uma página de produto real)                                                                                                                              |
| 7. Alternativa segura existe                     | ✅ `amazon.com.br/.../dp/B07G7JPTCV` — página de produto real, título/marca/peso batendo exatamente com o cadastro                                                                                                                                                                                 |
| 8. Afiliado aplicável hoje                       | ✅ **sim, automaticamente** — `amazon-br` já é `isAffiliate: true` com `affiliateBaseUrl` configurado (`tag=suplescore-20`); não precisa de `affiliateUrl` por oferta, só corrigir `url` (e trocar `storeId` de `netshoes` para `amazon-br`, já que a oferta atual está numa loja sem monetização) |

**Classificação final: 🟢 candidata segura.**

**Correção executada (2026-09-18, autorização explícita)**: nova
`PriceEntry` criada via `POST /api/catalog/skus/{id}/prices` —
`storeId: amazon-br`, `url: .../dp/B07G7JPTCV`, **mesmo `priceCents`
já capturado (R$44,90, não inventado)**, `affiliateUrl` **não**
preenchido (não é necessário — `amazon-br` já resolve via
`Store.affiliateBaseUrl`). Histórico anterior (3 capturas em
`netshoes`, URL genérica) permanece intacto — `PriceEntry` é
append-only, nada foi apagado ou sobrescrito.

**Validação pós-correção**:

| Critério                                  | Resultado                                                                                                            |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `/go/probiotica-creatina-300g`            | ✅ `Location: https://www.amazon.com.br/Creatina-Pura-Probi%C3%B3tica-300g/dp/B07G7JPTCV?tag=suplescore-20`          |
| Produto continua na vitrine (`/creatina`) | ✅ presente                                                                                                          |
| Tracking                                  | ✅ `OutboundClick` novo com `wasAffiliate: true`, `storeId: amazon-br`                                               |
| Isolamento — só esta oferta mudou         | ✅ confirmado: exatamente 1 `PriceEntry` nova criada no banco inteiro (janela de 5 min), nenhum outro produto tocado |
| Código/schema/migration                   | ✅ nenhum alterado — mudança 100% via API existente, sem necessidade de rodar typecheck/testes                       |

Único produto restante da lista de 4 (§2) sem monetização real: os
outros 3 (`integralmedica-creatina-creapure-300g`, `dux-creatina-300g`,
`vitafor-creatina-300g`) continuam pendentes, sem alteração.

### `integralmedica-creatina-creapure-300g` — 🟡 médio risco

Nome do cadastro já especifica **"Creapure"**, o que ajuda a
descartar a linha "Hardcore"/regular da marca. Mas a busca encontrou
múltiplas listagens plausíveis para a linha Creapure (`B0CVP6GFKS` —
"Creatina Creapure Nutrify", entre outras) — precisa confirmação
visual da página exata antes de escrever, mesmo padrão já usado nas 5
correções anteriores (não é ambiguidade de linha, é ambiguidade de
qual anúncio/vendedor é o canônico).

### `dux-creatina-300g` — 🟡 médio risco

Cadastro **não menciona "Creapure"** no nome, mas a Dux vende
principalmente uma linha "100% Creapure Sem Sabor" na Amazon
(`B07JHH3WJB`, repetida em duas listagens com nomes ligeiramente
diferentes) — precisa confirmar se o cadastro atual pretende
representar essa linha específica ou uma linha genérica sem Creapure.
Também existem variantes "Kit 2"/"Kit 3" (múltiplos potes) que **não
são o mesmo produto** — risco real de pegar o kit errado em vez da
unidade única.

### `vitafor-creatina-300g` — 🔴 alto risco, não configurar agora

A Vitafor vende **duas linhas claramente distintas**: "Creatina
Monohidratada" simples (`B07LCTTF8V`/`B07MMKMZN2`) e **"Creafort"**
(linha com Creapure, `B07VX8RMZM` e variantes) — nomes de produto
completamente diferentes, não é só uma questão de embalagem. O
cadastro (`Creatina Vitafor 300g`, sem atributos) não deixa claro qual
das duas linhas é a pretendida. Mesma categoria de ambiguidade já
rejeitada em casos anteriores (Growth Creatina, Black Skull Creatina)
— só seria seguro corrigir com uma foto real do produto já publicada
(que este produto não tem) ou confirmação humana direta.

## 3. Mercado Livre — nada novo

Confirmado: apenas as 3 ofertas já conhecidas continuam existindo.
Nenhum candidato novo — próximo passo aqui não é "achar mais
candidatos", é decidir se vale a pena capturar uma URL nova do
Mercado Livre para outro produto do catálogo (fluxo de captura de
preço, fora do escopo de afiliado).

## 4. Sem afiliado por enquanto (maioria do catálogo)

44 das 62 ofertas estão em lojas próprias de marca (`*-oficial`) ou
revendedores menores, todas `isAffiliate: false`. Nenhuma tem programa
de afiliado técnico configurado hoje — não são candidatos a
`affiliateUrl` nem a `Store.affiliateBaseUrl` sem antes confirmar que
a marca/revendedor tem algum programa de afiliados real (mesmo
processo que já levou à descoberta de Amazon/Mercado Livre/rejeição da
Netshoes). Fora do escopo desta leitura.

---

## Entregável

### Top candidatos seguros (por ordem de prioridade real, não 5 artificiais)

Só existem **3 candidatos acionáveis** hoje nesta frente (não 5 — os
demais 56 produtos ou já estão monetizados, ou não têm programa de
afiliado real disponível):

1. ✅ **`probiotica-creatina-300g`** — **corrigido em 2026-09-18**
   (URL real `dp/B07G7JPTCV`, loja trocada `netshoes` → `amazon-br`,
   `/go` validado com `tag=suplescore-20`).
2. 🟡 **`integralmedica-creatina-creapure-300g`** — médio risco,
   precisa confirmação visual da página exata antes de escrever.
3. 🟡 **`dux-creatina-300g`** — médio risco, precisa confirmar se é a
   linha Creapure e evitar pegar variante "Kit".

### Descartes/pendências

1. 🔴 **`vitafor-creatina-300g`** — duas linhas reais distintas
   (Monohidratada simples vs Creafort), sem evidência para escolher.
2. ⏸️ **`nutrata-creatina-creapure-250g`** — já `UNPUBLISHED`, path
   seguro já documentado (recaptura do zero contra ASIN real).
3. ❌ **`max-titanium-mass-titanium-17500-3kg`** (Mercado Livre) —
   sabor ambíguo, descartado anteriormente.
4. ❌ **`integralmedica-sinister-mass-3kg`** (Mercado Livre) —
   anúncio inativo, descartado anteriormente.
5. — Nenhum quinto item real de descarte novo encontrado nesta
   auditoria; o catálogo restante (44 ofertas) simplesmente não tem
   programa de afiliado disponível, não é "descarte" no sentido de
   "candidato rejeitado", é "não aplicável ainda".

### Próxima ação recomendada

Não configurar nada ainda. Se a frente for retomada: validar
manualmente (navegador real, mesmo rigor das 5 correções anteriores)
a página exata de `probiotica-creatina-300g` primeiro (menor risco,
maior ganho — sai de "sem monetização real" para "monetizado"), depois
`integralmedica-creatina-creapure-300g` e `dux-creatina-300g` com
confirmação visual adicional. `vitafor-creatina-300g` só entra em jogo
se surgir evidência forte (foto real publicada ou confirmação humana
de qual linha o cadastro representa).
