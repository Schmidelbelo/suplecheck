# Desenho técnico — link de afiliado por oferta (Mercado Livre e futuros)

Documento de arquitetura, não implementação. Motivado pela auditoria do
Mercado Livre (`docs/READINESS_PRODUCAO_BETA.md §3.1`, `docs/LOG_OPERACIONAL.md`
2026-09-16): o link oficial de afiliado do Mercado Livre é um deeplink
curto gerado **por produto** no painel (`meli.la/<código>`), incompatível
com o modelo atual de `Store.affiliateBaseUrl` — um template único
aplicado a **qualquer** URL de destino da loja.

**Nada aqui foi implementado.** Nenhum código, schema, migration ou dado
alterado. Este documento só descreve o que precisaria mudar, e por quê,
para quando a implementação for autorizada.

---

## 1. Modelo atual — onde nasce o link final hoje

Cadeia real, do banco até o redirect (`src/app/go/[productId]/route.ts` →
`resolveOutboundClick()` em
`src/modules/monetization/services/outboundClick.service.ts`):

1. `Product` → `Sku` ativo → `PriceEntry` mais recente (por `skuId` +
   `storeId`, ordenado por `capturedAt`).
2. `PriceEntry.url` é a URL real do produto **na loja** (capturada pelo
   pipeline de preço ou cadastrada manualmente) — o destino "cru", sem
   afiliado.
3. `buildAffiliateUrl({ destinationUrl: priceEntry.url, store })`
   (`src/modules/monetization/lib/affiliateUrl.ts`) decide o link final:
   - `Store.isAffiliate=false` → destino cru, sem afiliado.
   - `Store.isAffiliate=true` + `Store.affiliateBaseUrl` reconhecido →
     aplica um dos dois formatos suportados: **wrapper** (`{url}`, ex.
     Awin/Rakuten) ou **querystring anexada** (ex. `tag=...`, modelo
     Amazon) — os dois pressupõem um template único que funciona pra
     **qualquer** `destinationUrl` da mesma loja.
4. `OutboundClick` grava o clique (`wasAffiliate` = resultado de
   `isAffiliateLink`).

**O ponto que quebra pro Mercado Livre**: os dois formatos suportados
hoje descrevem uma _transformação_ da URL de destino (adicionar um
parâmetro, ou envolver num wrapper). O link `meli.la/<código>` **não é**
uma transformação da URL do produto — é um valor opaco, gerado
manualmente no painel, específico daquele produto exato. Não existe
`Store.affiliateBaseUrl` que produza `meli.la/16T3cTu` a partir de
qualquer URL de produto do Mercado Livre.

## 2. `PriceEntry` já comporta link por oferta? Não.

```prisma
model PriceEntry {
  id            String            @id @default(cuid())
  skuId         String
  storeId       String
  priceCents    Int
  currency      String            @default("BRL")
  url           String?           // destino cru — não o link de afiliado
  availability  StockAvailability @default(UNKNOWN)
  importBatchId String?
  capturedAt    DateTime          @default(now())
  ...
}
```

`PriceEntry.url` é só o destino cru. Não há campo hoje para armazenar um
link de afiliado já pronto, específico daquela captura/oferta.

## 3. Proposta mínima

Adicionar **um campo opcional** em `PriceEntry`:

```prisma
model PriceEntry {
  ...
  url           String?
  /// Link de afiliado já pronto para ESTA oferta específica, quando o
  /// programa exige geração manual por produto (ex.: deeplink Mercado
  /// Livre) em vez de um template aplicável a qualquer URL da loja.
  /// Quando presente, usado como destino final do /go diretamente —
  /// Store.affiliateBaseUrl é ignorado para esta captura. Quando
  /// ausente (o caso normal hoje), nada muda.
  affiliateUrl  String?
  availability  StockAvailability @default(UNKNOWN)
  ...
}
```

**Por que este é o menor corte possível**:

- Não mexe no modelo de `Store` — `affiliateBaseUrl`/`isAffiliate`
  continuam servindo Amazon e qualquer futura rede baseada em template.
- Campo opcional, `null` por padrão — toda captura de preço existente
  continua funcionando exatamente igual, sem migração de dado.
- Um único novo "modo" de resolução no `/go`: se `PriceEntry.affiliateUrl`
  existir, é o destino final (já é o link de afiliado pronto); senão,
  cai no fluxo atual (`buildAffiliateUrl` + `Store`).

## 4. Impacto por área

### 4.1 Banco/schema

- 1 coluna nova, nullable, em `price_entries` — `ALTER TABLE ... ADD COLUMN "affiliateUrl" TEXT;`.
- Sem backfill necessário (nenhum dado existente precisa do campo).
- Sem mudança em `Store`, `Product`, `Sku`, `OutboundClick`.

### 4.2 Admin/importação

- `src/modules/pricing/validators/price.schema.ts`: `recordPriceSchema`
  ganha `affiliateUrl: z.string().url().optional()`.
- `src/modules/pricing/services/price.service.ts` (`recordPrice`): passa
  `affiliateUrl: input.affiliateUrl` no `create`.
- `POST /api/catalog/skus/[id]/prices` (já protegida por
  `ADMIN_API_KEY`) passa a aceitar o campo — nenhuma rota nova.
- **`PriceCaptureJobRunner.ts` (pipeline automático de captura) não
  muda** — nunca vai gerar esse valor sozinho, porque o link do Mercado
  Livre exige ação manual no painel deles (não existe API pública pra
  gerar deeplink a partir de uma URL arbitrária, conforme já investigado
  em `docs/READINESS_PRODUCAO_BETA.md §3.1`). Preencher o campo continua
  sendo um passo manual, produto a produto, via essa rota administrativa
  — hoje só via `curl`/script; uma tela dedicada em `/admin` é
  melhoria futura, não bloqueadora.

### 4.3 Card de oferta (UI)

- **Zero mudança.** Nenhum componente (`OfferCard.tsx`,
  `RankingEntryCard.tsx`, `ProductMiniCard.tsx` etc.) monta o link
  diretamente — todos chamam `buildOutboundHref()` e delegam a decisão
  ao `/go`. A UI não precisa saber se a oferta tem link por-oferta ou
  por-loja.

### 4.4 `/go` / tracking

Único ponto de código que muda de fato —
`src/modules/monetization/services/outboundClick.service.ts`,
`resolveOutboundClick()`:

```ts
// hoje:
const { url, isAffiliateLink } = buildAffiliateUrl({
  destinationUrl: priceEntry.url,
  store: priceEntry.store,
});

// proposto:
const { url, isAffiliateLink } = priceEntry.affiliateUrl
  ? { url: priceEntry.affiliateUrl, isAffiliateLink: true }
  : buildAffiliateUrl({ destinationUrl: priceEntry.url, store: priceEntry.store });
```

A query que busca `priceEntry` precisa incluir o novo campo `select`.
`OutboundClick.wasAffiliate` continua funcionando sem mudança de
schema — só passa a poder ser `true` por um motivo novo.

### 4.5 SEO

- **Recomendação: não mudar.** O JSON-LD `Product.offers.url`
  (`src/lib/seo/schema.ts`, consumido por
  `ProductDetailPage.tsx`) hoje usa `presentation.price.url` — a URL
  **cru** do produto na loja, não a de afiliado. Manter assim: dado
  estruturado não deve expor parâmetro/tag de afiliado (prática comum
  de SEO — a URL "canônica" da oferta, não a de tracking). Nenhuma
  mudança necessária em `schema.ts`/`productView.service.ts`.

### 4.6 Compatibilidade com Amazon e lojas sem afiliado

- Amazon: `PriceEntry.affiliateUrl` continua `null` — resolução cai no
  fluxo atual (`Store.affiliateBaseUrl` com `tag=suplescore-20`), sem
  nenhuma mudança de comportamento.
- Lojas sem afiliado (`isAffiliate=false`): idem, `affiliateUrl` null,
  fluxo atual preservado exatamente.
- Nenhum link existente quebra — o campo é aditivo e só é consultado
  quando presente.

## 5. Migration necessária?

**Sim**, mas mínima: uma migration Prisma de uma coluna nullable, sem
transformação de dado (`prisma migrate dev --name add_price_entry_affiliate_url`
gerado a partir do schema atualizado). Sem downtime esperado — `ALTER
TABLE ADD COLUMN` nullable é uma operação rápida mesmo em produção.

## 6. Importadores/scripts precisam mudar?

**Não o pipeline automático** (`PriceCaptureJobRunner.ts`) — ele nunca
vai preencher esse campo sozinho, é sempre entrada manual. Os únicos
arquivos que precisam de mudança de código (quando isso for autorizado)
são os listados em 4.2 e 4.4 — schema Prisma, `price.schema.ts`,
`price.service.ts`, `outboundClick.service.ts`. Nenhum script batch
(`prisma/*.ts`) precisa de alteração.

## 7. Como evitar quebrar links atuais

- Campo nullable com fallback total para o comportamento de hoje —
  nenhuma captura de preço existente tem `affiliateUrl`, então 100% dos
  redirects atuais continuam idênticos até alguém preencher o campo
  manualmente para uma oferta específica.
- Nenhuma mudança em `Store`/`affiliateBaseUrl` — Amazon/Netshoes
  (encerrado)/demais lojas não são tocadas por esta mudança.
- Rollout seguro: a primeira vez que o campo for usado de verdade
  (Mercado Livre) é um preenchimento manual, item a item, com teste de
  clique real (`/go/{slug}?source=...`) antes de confiar — mesmo
  procedimento já documentado em `docs/GESTAO_AFILIADOS.md §5` para
  qualquer ativação de afiliado.

## 8. Riscos e limitações conhecidas

- **Sem automação de geração de link**: preencher `affiliateUrl` para
  cada produto do Mercado Livre continua sendo trabalho manual — copiar
  o deeplink do painel "Compartilhar", produto a produto. Não escala
  automaticamente; é o mesmo grau de esforço editorial de hoje, só
  agora com um lugar certo pra guardar o resultado.
- **Sem UI dedicada inicialmente**: a rota administrativa
  (`POST /api/catalog/skus/[id]/prices`) já aceitaria o campo, mas sem
  uma tela em `/admin` para colar o link, o preenchimento seria via
  `curl`/script até que o volume justifique uma tela.
- **Validade do deeplink**: não confirmado se `meli.la/<código>` expira
  ou pode ser revogado pelo Mercado Livre — se acontecer, o link
  armazenado fica stale sem nenhum alerta automático (mesma limitação
  que `PriceEntry.url` normal já tem hoje — captura desatualizada não
  dispara alerta).
- **Nome do campo é deliberadamente genérico** (`affiliateUrl`, não
  `mercadoLivreDeeplink`) — serve para qualquer rede futura que exija o
  mesmo padrão (link por-oferta, não por-loja), sem precisar de novo
  campo a cada rede nova.

## 9. Ordem de implementação sugerida (quando autorizado)

1. `prisma/schema.prisma`: adicionar `affiliateUrl String?` em `PriceEntry`.
2. Migration Prisma (`prisma migrate dev`), revisar o SQL gerado antes de aplicar.
3. `src/modules/pricing/validators/price.schema.ts`: campo opcional no `recordPriceSchema`.
4. `src/modules/pricing/services/price.service.ts`: repassar o campo em `recordPrice`.
5. `src/modules/monetization/services/outboundClick.service.ts`: branch de resolução (§4.4), incluindo `affiliateUrl` no `select` da query.
6. Testes: `affiliateUrl.test.ts` (ou teste novo) cobrindo o branch; `go.api.test.ts` cobrindo `wasAffiliate=true` via `PriceEntry.affiliateUrl`.
7. `npm run typecheck && npm test`.
8. Preencher `affiliateUrl` para 1 produto real do Mercado Livre (dry-run mental: conferir antes/depois), testar clique real, só depois considerar lote maior.
9. Atualizar `docs/GESTAO_AFILIADOS.md` com o procedimento de preenchimento por oferta.

---

_Documento de arquitetura, 2026-09-17. Nenhum código, schema, migration ou dado alterado para produzi-lo. Não configura `affiliateBaseUrl`, não inventa link do Mercado Livre, não toca em imagens, Nutrata ou `affiliate-discovery`._
