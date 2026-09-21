# Procedimento — Afiliado Mercado Livre por Oferta

Guia operacional curto pra repetir, com segurança, o que já foi validado
uma vez em produção (`docs/LOG_OPERACIONAL.md`, 2026-09-17): Growth
Supplements Óleo de Peixe Ultra 75 Cápsulas → `https://meli.la/2jWrJqm`.

**Pré-requisito técnico já pronto, não repetir**: `PriceEntry.affiliateUrl`
já existe no schema, já está migrado em produção, e `/go` já sabe usar o
campo com precedência sobre `Store.affiliateBaseUrl` (ver
`docs/DESENHO_AFILIADO_POR_OFERTA.md`). Este documento é só o passo a
passo operacional — nenhum código novo é necessário pra configurar uma
oferta.

---

## Passo a passo

### 1. Escolher o produto no SupleScore

Escolha um produto **já publicado** no catálogo que já tenha uma
`PriceEntry` capturada na loja `mercado-livre` (confirme via
`GET /api/admin/metrics` ou consultando o histórico de preço do SKU —
`GET /api/catalog/skus/{id}/prices`). Nunca escolha um produto sem
captura prévia — inventar a URL de destino não é seguro.

### 2. Abrir a página EXATA no Mercado Livre

Use a mesma URL já registrada em `PriceEntry.url` para esse produto —
não uma busca, não a home, não uma categoria. Confirme visualmente que
a página aberta é o produto certo: mesma marca, mesmo peso/quantidade,
**mesmo sabor/variante** se o produto tiver.

### 3. Gerar o link no painel de afiliados

No painel de afiliados do Mercado Livre, com a página exata do produto
aberta, clique **"Compartilhar"**. O painel devolve um deeplink curto
(`https://meli.la/<código>`) e um "ID para busca" alfanumérico — só o
deeplink interessa pra este fluxo.

### 4. Nunca reutilizar link antigo/genérico

**Cada deeplink é único por produto.** Um link gerado pra um produto
não serve pra outro — reutilizar por engano redireciona o usuário pro
produto errado. Antes de preencher qualquer coisa, confirme que o link
foi gerado **agora**, **nesta sessão do painel**, **na página exata**
do produto que você está configurando — não um link copiado de uma
conversa anterior, de um teste antigo ou de outro produto (foi
exatamente o que quase aconteceu na primeira configuração real: um link
de teste genérico foi colado por engano e descartado a tempo, antes de
qualquer escrita).

### 5. Preencher SOMENTE `PriceEntry.affiliateUrl`

Via `POST /api/catalog/skus/{id}/prices` (protegida por `ADMIN_API_KEY`):

```bash
curl -X POST "https://suplescore.com.br/api/catalog/skus/{skuId}/prices" \
  -H "x-api-key: $ADMIN_API_KEY" -H "Content-Type: application/json" \
  -d '{
    "storeId": "<id da loja mercado-livre>",
    "priceCents": <mesmo preço já capturado>,
    "currency": "BRL",
    "url": "<mesma URL já capturada>",
    "affiliateUrl": "<deeplink meli.la gerado agora>",
    "availability": "IN_STOCK"
  }'
```

Reaproveite o `priceCents` e o `url` da captura mais recente já
existente — **não invente um preço novo**. `PriceEntry` é append-only
(nunca `UPDATE`), então isso cria uma nova linha que passa a ser "a
oferta atual" do SKU, com o `affiliateUrl` a mais.

**Nunca altere `Store.affiliateBaseUrl`** — o Mercado Livre não usa esse
campo (deeplink é por produto, não por loja).

### 6. Validar `/go`

```bash
curl -sI "https://suplescore.com.br/go/{slug-do-produto}?source=product-page" | grep -i location
```

O `Location` deve ser exatamente o deeplink `meli.la` que você acabou
de gerar — não a URL direta do produto.

### 7. Validar o tracking

Confirme que o clique de teste do passo 6 gerou um `OutboundClick` novo
com `wasAffiliate: true` (via `GET /api/admin/metrics` ou consultando a
tabela diretamente). Cliques antigos do mesmo produto, de antes desta
configuração, devem continuar com `wasAffiliate: false` — não são
reescritos.

### 8. Confirmar que só 1 registro mudou

Consulte quantos `PriceEntry` no banco inteiro têm `affiliateUrl`
preenchido — o número deve ter subido em exatamente 1 (o produto que
você acabou de configurar). Nenhum outro produto, nenhuma outra loja.

---

## Erros a evitar (confirmados na prática)

- **Link genérico/antigo reaproveitado** — cada deeplink é único por
  produto; sempre gerar de novo, na página exata, na hora.
- **Produto com sabor/variante ambíguo** — se o catálogo não especifica
  qual sabor/variante o SKU representa, e a fonte do Mercado Livre é
  específica de um sabor, não configurar até resolver a ambiguidade no
  catálogo primeiro (mesma regra já aplicada à frente de imagens, ver
  `docs/AUDITORIA_COBERTURA_IMAGENS.md`).
- **Inventar preço ou URL** — sempre reaproveitar o que já foi
  capturado; nunca estimar.

---

## Próximos candidatos (avaliados, não configurados)

Levantamento contra produção (2026-09-17) de todos os produtos que já
têm uma `PriceEntry` capturada na loja `mercado-livre` — só existem
**3 no total**, e 1 já foi configurado. Sobram **2 candidatos reais**
com dado já capturado; nenhum terceiro existe ainda sem inventar
captura nova (fora do escopo desta tarefa, ver nota no fim desta
seção).

### 1. Integralmédica Sinister Mass 3kg (`integralmedica-sinister-mass-3kg`) — ❌ DESCARTADO (2026-09-17)

- **URL Mercado Livre já capturada**: `https://produto.mercadolivre.com.br/MLB-962580047-hipercalorico-sinister-mass-3kg-integralmedica-brinde-_JM`
- **Validação manual (navegador real)**: a URL **não abre mais como anúncio válido** — cai em "Parece que esta página não existe". Confirma a suspeita já registrada aqui (risco do `-brinde-` = anúncio promocional temporário, pausado/removido pelo vendedor).
- **Resultado**: descartado por enquanto. `PriceEntry.url` desta oferta está desatualizada (o anúncio de origem não existe mais) — isso é um problema de dado de preço/captura, não de afiliado; não é este documento que resolve, mas fica registrado para quem cuidar da atualização de captura de preço deste produto.
- **Não configurar `affiliateUrl`** para este produto enquanto a `PriceEntry.url` não for recapturada contra um anúncio real e ativo.

**Retomada da recaptura (2026-09-21) — candidato encontrado, não confirmado, nada aplicado**:

- Busca web (texto) encontrou um anúncio ativo aparente do mesmo
  produto sob outro vendedor: `MLB-2104998441`
  ("Hipercalórico Sinister Mass 3kg - Integralmedica -envio Full",
  G7 Nutrição Esportiva, **R$78,99**) — marca, produto e peso batem
  (Integralmédica, Sinister Mass, 3kg); este anúncio específico não
  menciona brinde no título (diferente do original `-brinde-`, que já
  estava morto).
- **Não foi possível confirmar visualmente que o anúncio está ativo**
  — Mercado Livre bloqueia `WebFetch` direto (`403 Forbidden`, mesmo
  padrão de bloqueio já visto com a Amazon), e a extensão Claude in
  Chrome (que permitiu a validação visual anterior, em 2026-09-17)
  está desconectada nesta sessão. Tentativas em 3 domínios espelho de
  revendedor também falharam (DNS inacessível ou certificado
  inválido).
- **Decisão explícita do usuário**: parar sem recapturar — nenhuma
  `PriceEntry` nova foi criada, `PriceEntry.url` do produto continua
  a mesma (URL antiga, já morta). Candidato fica registrado, mas
  **não confirmado**, para quando houver acesso a navegador real.
- **Nenhuma escrita realizada**: nenhum banco, catálogo, preço,
  afiliado, imagem, ranking, Max Titanium, Amazon, Netshoes, código,
  schema ou `affiliate-discovery` alterado.

### 2. Max Titanium Mass Titanium 17500 3kg (`max-titanium-mass-titanium-17500-3kg`)

- **URL Mercado Livre já capturada**: `https://www.mercadolivre.com.br/hipercalorico-mass-titanium-17500-3kg-max-titanium-sabor-morango/p/MLB18724697`
- **Catálogo**: sem sabor especificado no nome/atributos — hipercalórico, 3kg, 619kcal/dose.
- **Por que NÃO é tão seguro quanto o outro**: a URL já capturada é explicitamente **sabor morango** (`sabor-morango` no slug), mas o catálogo não compromete o produto a nenhum sabor específico — mesma categoria de ambiguidade já documentada para o caso Probiótica Epic Pré-Treino (`docs/AUDITORIA_COBERTURA_IMAGENS.md §8.3`): se a marca vende esse hipercalórico em mais de um sabor, o SKU do SupleScore pode não representar especificamente "morango", e configurar esse deeplink arriscaria vincular uma imagem/link de sabor específico a um produto genérico no catálogo.
- **Risco de ambiguidade**: **alto** — precisa confirmar antes se Max Titanium vende esse hipercalórico só em morango (sem ambiguidade real) ou em múltiplos sabores (ambiguidade real, mesmo tratamento do caso Probiótica: não configurar até resolver no catálogo).
- **Prioridade**: **único candidato restante** (2026-09-17, depois do candidato 1 ser descartado) — mas só configurável depois de resolver a ambiguidade de sabor, não antes.

### Sobre o "3º candidato"

Não existe um terceiro produto com `PriceEntry` da loja `mercado-livre`
já capturada — só os 2 acima (1 descartado, 1 com ambiguidade não
resolvida), além do que já foi configurado. Gerar um terceiro exigiria
capturar uma URL nova do Mercado Livre pra outro produto do catálogo
primeiro (fluxo de captura de preço, não de afiliado) — fora do escopo
desta tarefa (proibido "rodar backfill"/"configurar nova oferta").
Registrado aqui como decisão honesta, não
como lacuna escondida.

---

_Documento operacional, 2026-09-17. Nenhum código, banco, `affiliateUrl` novo, ou dado real alterado para produzi-lo — só leitura contra produção via `PriceEntry`/`Product` já existentes._
