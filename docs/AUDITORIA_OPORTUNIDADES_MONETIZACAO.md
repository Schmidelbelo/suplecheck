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
`amazon-br`, **6 têm URL de busca genérica** (`amazon.com.br/s?k=...`),
não a página de um produto específico:

- `growth-creatina-monohidratada-300g`
- `max-titanium-creatina-300g`
- `black-skull-creatina-300g`
- `atlhetica-creatina-300g`
- `nutrata-creatina-creapure-250g`
- `optimum-nutrition-creatine-300g`

O afiliado técnico continua funcionando (a tag é aplicada em cima da
própria URL de busca), mas o clique manda o usuário pra uma lista de
resultados, não pro produto exato — qualidade de conversão pior que um
link direto. Não é um problema de afiliado, é captura de preço
desatualizada (mesma categoria do achado do Integralmédica Sinister
Mass no Mercado Livre). Registrado aqui como observação, não é ação
desta auditoria.

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
3. Corrigir as **6 URLs de busca genérica da Amazon** listadas na §3 —
   não bloqueia monetização (já funciona via tag), mas melhora
   qualidade de conversão.

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
