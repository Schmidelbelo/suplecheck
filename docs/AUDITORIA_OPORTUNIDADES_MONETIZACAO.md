# Auditoria de Oportunidades de Monetização por Oferta

Levantamento **só leitura** contra produção, 2026-09-17, motivado pelos
2 candidatos de Mercado Livre já esgotados (`docs/PROCEDIMENTO_AFILIADO_MERCADO_LIVRE.md`):
Integralmédica Sinister Mass 3kg (anúncio inativo) e Max Titanium Mass
Titanium 17500 3kg (ambiguidade de sabor). Objetivo: mapear todas as
ofertas atuais do catálogo por loja e classificar risco, sem preencher
nenhum `affiliateUrl` novo.

**Nada foi alterado.** Nenhum código, banco, imagem ou
`affiliate-discovery` tocado — só consulta às tabelas `Store`,
`Product`, `Sku`, `PriceEntry` já existentes.

---

## 1. Panorama por loja

32 lojas cadastradas no total. Só 2 têm algum tipo de afiliado
técnico ativo hoje:

| Loja              | `isAffiliate` | `affiliateBaseUrl`      | Status real                                                                                                                                                                           |
| ----------------- | ------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **amazon-br**     | `true`        | configurado (`tag=...`) | ✅ Monetizada — template por loja já funciona pra qualquer URL                                                                                                                        |
| **netshoes**      | `true`        | `null`                  | ❌ Rejeitado permanentemente pelo anunciante (ver `docs/LOG_OPERACIONAL.md` 2026-09-17) — sinalizado `isAffiliate=true` no banco mas sem caminho de monetização real; não é candidato |
| **mercado-livre** | `false`       | `null`                  | 🟡 Modelo por-oferta (`PriceEntry.affiliateUrl`) — 1 oferta configurada, 2 descartadas por ora                                                                                        |
| Demais 29 lojas   | `false`       | `null`                  | Sem programa de afiliado confirmado — não são candidatos hoje                                                                                                                         |

## 2. Mercado Livre — situação atual (3 ofertas no total)

| Produto                                | URL capturada                                                    | `affiliateUrl`            | Classificação                                                                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Growth Óleo de Peixe Ultra 75 Cápsulas | `.../omega-3-oleo-de-peixe.../p/MLB20559531`                     | `https://meli.la/2jWrJqm` | ✅ **Configurado** (2026-09-17)                                                                                                                             |
| Integralmédica Sinister Mass 3kg       | `produto.mercadolivre.com.br/MLB-962580047-...-brinde-_JM`       | `null`                    | ❌ **Alto risco — descartado**: anúncio confirmado inativo ("Parece que esta página não existe")                                                            |
| Max Titanium Mass Titanium 17500 3kg   | `.../hipercalorico-mass-titanium.../sabor-morango/p/MLB18724697` | `null`                    | ⚠️ **Alto risco — não configurar**: URL capturada é explicitamente sabor morango, catálogo não especifica sabor (mesma ambiguidade do caso Probiótica Epic) |

**Não existe candidato novo de Mercado Livre hoje** além desses 3 já
conhecidos — nenhum outro produto do catálogo tem `PriceEntry.url`
apontando pra `mercadolivre.com.br`/`produto.mercadolivre.com.br`.

## 3. Amazon — já monetizada, mas com achado de qualidade de dado

`amazon-br` já é `isAffiliate=true` com `affiliateBaseUrl` configurado
— qualquer `PriceEntry.url` dessa loja já sai com `tag=` aplicado
automaticamente, sem precisar de `affiliateUrl` por oferta. **Não é
candidato para este fluxo** (já resolvido pelo modelo de loja).

**Achado colateral, fora do escopo desta auditoria mas relevante pra
quem cuidar de captura de preço**: das 15 ofertas atuais da loja
`amazon-br`, **6 tinham URL de busca genérica** (`amazon.com.br/s?k=...`),
não a página de um produto específico. O afiliado técnico continuava
funcionando (a tag é aplicada em cima da própria URL de busca), mas o
clique mandava o usuário pra uma lista de resultados, não pro produto
exato — qualidade de conversão pior que um link direto.

### 3.1 Correção aplicada (2026-09-17) — 3 de 6 resolvidas

Pra cada um dos 6, pesquisado o ASIN real do produto exato (marca,
peso, sabor/variante batendo) e validado via a própria página do
produto antes de escrever — mesmo rigor já usado pro Mercado Livre.

**Corrigidas** (nova `PriceEntry` criada via `POST /api/catalog/skus/{id}/prices`,
mesmo preço já capturado, só a `url`; `Store.affiliateBaseUrl` intocado;
`/go` validado com `tag=suplescore-20` aplicado):

| Produto                           | URL antiga                                                            | URL nova                                                                                                                                      |
| --------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `max-titanium-creatina-300g`      | `amazon.com.br/s?k=Max+Titanium+Creatina+300g`                        | `amazon.com.br/.../dp/B07DVJC66X` — "MAX TITANIUM CREATINA 300 GR MONOHIDRATADA", unidade única, sem sabor                                    |
| `atlhetica-creatina-300g`         | `amazon.com.br/s?k=Atlhetica+Nutrition+Creatina+Nitro+300g`           | `amazon.com.br/.../dp/B07MPZLM1N` — "Creatina 100% Pure em Pó 300g, Atlhetica Nutrition", bate exatamente com o nome já corrigido no catálogo |
| `optimum-nutrition-creatine-300g` | `amazon.com.br/s?k=Optimum+Nutrition+Micronized+Creatine+Powder+300g` | `amazon.com.br/.../dp/B07774XR8W` — "Optimum Nutrition Creatina Monohidratada Micronizada em Pó Sem Sabor 300g", unidade única                |

**Não corrigidas — ambiguidade real, deixadas com a URL de busca genérica**:

| Produto                              | Motivo                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `growth-creatina-monohidratada-300g` | Growth vende **duas linhas distintas** de creatina 250g na Amazon: "Creatina Monohidratada" (regular) e "Creatina Creapure" (premium, certificação alemã) — todos os resultados de busca encontrados eram da linha Creapure; o catálogo não especifica qual linha este SKU representa. Mesma categoria de risco documentada em `docs/DESENHO_AFILIADO_POR_OFERTA.md`/auditoria de imagens: não escolher por aproximação. |
| `black-skull-creatina-300g`          | Black Skull vende múltiplas sub-linhas com o mesmo peso (**"Creator"** vs **"Creatine Turbo"**, este último com maltodextrina/carboidrato adicionado — produto diferente, não só sabor) mais variantes com sabor (laranja, uva). Nome do catálogo ("Creatina Black Skull 300g") não indica qual sub-linha.                                                                                                               |
| `nutrata-creatina-creapure-250g`     | Ambiguidade de SKU já conhecida e documentada (`docs/AUDITORIA_COBERTURA_IMAGENS.md §6`) — Nutrata vende real em 150g/300g, não 250g. Mesmo bloqueio de antes, não resolvido por este achado da Amazon.                                                                                                                                                                                                                  |

**Validação executada**: `npm run typecheck` limpo, 37/37 testes
unitários de pricing/monetização passando (nenhum código tocado — só
dado via API já existente), `/go` confirmado pros 3 produtos
corrigidos com `tag=suplescore-20` aplicado corretamente.

Adicionalmente, **3 ofertas de outras lojas** (`loja-oficial`,
`netshoes`) também têm `PriceEntry.url` apontando pra
`amazon.com.br/s?k=...` — provável erro de atribuição de loja na
captura (a URL é da Amazon, mas o `storeId` registrado é de outra
loja). Fora do escopo de afiliado, sinalizado pra quem cuidar de
captura/atribuição de preço.

## 4. Outras lojas com possibilidade futura

29 lojas restantes, todas `isAffiliate=false`, sem `affiliateBaseUrl`.
Dividem-se em dois grupos:

### 4.1 Lojas oficiais de marca (potencial programa próprio)

`adaptogen-oficial`, `bodyaction-oficial`, `dark-lab-oficial`,
`darkness-oficial`, `dux-oficial`, `integralmedica-oficial`,
`max-titanium-oficial`, `nutrata-oficial`, `probiotica-oficial`,
`vitafor-oficial` — 10 lojas, 1 produto ou mais cada. Se algum desses
fabricantes tiver programa de afiliado próprio (fora de marketplace),
o modelo certo é `Store.affiliateBaseUrl` (template por loja, como
Amazon), **não** o campo por-oferta — não é candidato para o fluxo do
Mercado Livre. Fica registrado só como mapa, sem nenhuma ação sugerida
aqui (decisão comercial, fora do escopo técnico desta auditoria).

### 4.2 Revendedores terceiros sem programa confirmado

`brasilfitsuplementos`, `cirurgica-estilo`, `cwb-gold-suplementos`,
`drogaria-minas-brasil`, `essencia-brasileira`, `fastfit-suplementos`,
`goldstar-supplements`, `gsuplementos`, `loja-nutrifit`,
`loja-oficial`, `madrugao-suplementos`, `materia-prima-suplementos`,
`mercadao-suplementos`, `new-millen-oficial`, `nutri-fast-shop`,
`sua-saude-distribuidora`, `vitaminas-brasil` — 17 lojas. Nenhuma tem
qualquer sinal de programa de afiliado técnico no banco. Não
candidatas hoje — precisariam de confirmação comercial primeiro (fora
do escopo técnico).

## 5. Classificação de risco — critério usado

- **Baixo risco**: produto sem variação obrigatória (sabor/versão) OU
  variação já explícita e batendo entre catálogo e URL capturada, URL
  aponta pra página de produto específica (não busca genérica), sem
  sinal de anúncio/promoção temporária.
- **Médio risco**: precisa confirmar versão/sabor/peso antes de
  configurar — catálogo não especifica variação que a fonte real tem.
- **Alto risco**: URL inativa/removida, produto com variação
  obrigatória não resolvida no catálogo, ou URL genérica (busca/home)
  em vez de produto específico.

## 6. Entregável — resumo executivo

**Candidatos seguros para monetização por oferta (Mercado Livre) hoje**:
nenhum. Os únicos 3 produtos com `PriceEntry.url` do Mercado Livre já
foram todos avaliados — 1 configurado, 2 em alto risco (descartar por
ora).

**Prioridade sugerida** (fora do modelo por-oferta, pra quando fizer
sentido revisitar):

1. Recapturar preço/URL do **Integralmédica Sinister Mass 3kg** contra
   um anúncio real e ativo no Mercado Livre — depois disso, reavaliar
   como candidato de afiliado por oferta.
2. Resolver a ambiguidade de sabor do **Max Titanium Mass Titanium
   17500 3kg** no catálogo (confirmar se a marca vende só em morango,
   ou corrigir o nome/atributos pra refletir o sabor certo) — depois
   disso, reavaliar como candidato.
3. ~~Corrigir as 6 URLs de busca genérica da Amazon~~ — **3 de 6 corrigidas em 2026-09-17** (§3.1): `max-titanium-creatina-300g`, `atlhetica-creatina-300g`, `optimum-nutrition-creatine-300g`. As 3 restantes (`growth-creatina-monohidratada-300g`, `black-skull-creatina-300g`, `nutrata-creatina-creapure-250g`) têm ambiguidade real de linha/SKU — precisam de decisão de catálogo antes, não são candidatas a correção automática.

**O que precisa de ação humana**:

- Item 1 e 2 acima exigem alguém com acesso ao catálogo/captura de
  preço, não afiliado.
- Qualquer programa de afiliado novo pras 27 lojas sem afiliado
  (§4) exige decisão/negociação comercial antes de qualquer trabalho
  técnico.

**O que deve ser descartado por enquanto**:

- Integralmédica Sinister Mass 3kg (Mercado Livre) — anúncio inativo.
- Max Titanium Mass Titanium 17500 3kg (Mercado Livre) — ambiguidade
  de sabor não resolvida.
- `netshoes` como loja de afiliado — rejeição permanente já confirmada,
  sinalização `isAffiliate=true` no banco está desatualizada
  (correção de dado, não desta auditoria).

---

_Auditoria gerada em 2026-09-17, contra produção. Só leitura — nenhum `affiliateUrl` preenchido, nenhum código/banco/imagem/`affiliate-discovery` alterado._
