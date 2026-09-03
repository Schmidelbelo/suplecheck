# Monetização por Afiliados — Arquitetura e Auditoria de Programas

Este documento cobre a arquitetura de monetização por afiliados do SupleCheck (implementada) e uma auditoria técnica dos programas de afiliado reais das lojas/marcas prioritárias (pesquisa, sem nenhuma integração ativada ainda).

## 1. Arquitetura criada

```
src/modules/monetization/
  lib/affiliateUrl.ts          — função pura: decide a URL final (afiliado ou não)
  lib/outboundLinkHref.ts      — função pura: monta o href /go/... usado por toda a UI
  services/outboundClick.service.ts — resolve produto/oferta real + grava o clique
src/app/go/[productId]/route.ts    — único ponto de saída (redirect 302)
```

Nenhum componente de UI monta uma URL de loja diretamente — todo botão de saída chama `buildOutboundHref()`, que devolve sempre `/go/{slug}?source=...&position=...`.

## 2. Fluxo de redirecionamento

```
Usuário clica em "Ver oferta"
  → href já é /go/{slug}?source=product-page&position=N
  → GET /go/[productId]
      → resolveOutboundClick(): produto + SKU ativo + PriceEntry mais recente + loja
      → produto não existe → 404 real
      → produto existe mas sem nenhuma oferta cadastrada → 302 para /creatina/{slug}
      → buildAffiliateUrl(): decide a URL final (afiliado ou direta)
      → grava 1 linha em outbound_clicks (best-effort)
      → 302 para a URL final
```

A URL de origem (`PriceEntry.url`) vem do pipeline de captura de preço — corrigido nesta sprint para sempre gravar a URL real da captura mais recente (ver `CHANGELOG.md` desta versão para a causa raiz e a correção).

## 3. Configuração por loja

`Store.isAffiliate` e `Store.affiliateBaseUrl` controlam o comportamento — nenhuma mudança de código é necessária para ativar uma loja, só dado.

### Contrato do `affiliateBaseUrl`

Um template contendo o literal `{url}` no ponto onde a URL de destino (capturada, já codificada) deve entrar:

```
affiliateBaseUrl = "https://rede-afiliados.example/click?merchant=123&url={url}"
```

`buildAffiliateUrl()` substitui `{url}` por `encodeURIComponent(destinationUrl)`. Se `isAffiliate = false`, ou `isAffiliate = true` mas `affiliateBaseUrl` estiver vazio ou sem o placeholder, o redirect cai para a URL normal — nunca um link inventado.

### Isto bate com redes reais?

Sim, para redes de **deep-link com wrapper** (a maioria das redes brasileiras relevantes para este catálogo):

| Rede                    | Formato real confirmado                                                                                                          | Compatível com `{url}`                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Lomadee**             | `https://redir.lomadee.com/v2/deeplink?url={url}&sourceId={sourceId}`                                                            | ✅ direto — `affiliateBaseUrl = "https://redir.lomadee.com/v2/deeplink?url={url}&sourceId=NOSSO_SOURCE_ID"`  |
| **Awin**                | `https://www.awin1.com/cread.php?awinmid=X&awinaffid=Y&ued={url}`                                                                | ✅ direto — `affiliateBaseUrl = "https://www.awin1.com/cread.php?awinmid=X&awinaffid=NOSSO_AFFID&ued={url}"` |
| **Rakuten Advertising** | Formato de wrapper equivalente (mesma família de redes de deep-link)                                                             | ✅ mesmo padrão, `id`/`u` conforme documentação do programa específico                                       |
| **Amazon Associates**   | Sem wrapper — a _tag_ é anexada como query param na PRÓPRIA URL amazon.com.br (`?...&tag=nossa-tag-20`), não uma URL de terceiro | ⚠️ **não se encaixa igual** — ver nota abaixo                                                                |

**Nota técnica sobre Amazon**: o modelo de tag da Amazon não é um wrapper, então `{url}` sozinho não cobre o caso de "acrescentar `&tag=` a uma URL que talvez já tenha ou não outros parâmetros". Duas rotas quando for ativar: (a) usar a Amazon via um agregador que já expõe formato de wrapper (o material pesquisado indica que a Rakuten Advertising também intermedia links de produtos Amazon em alguns contextos — confirmar antes de assumir), ou (b) uma pequena extensão em `affiliateUrl.ts` para um segundo modo "anexar parâmetro" além do atual "substituir template" — **não implementado nesta sprint**, fora do escopo pedido ("sem implementar integrações ainda").

## 4. Como adicionar uma nova loja

1. Confirmar que a loja já existe em `Store` (`slug`, `name`) — se não existir, criar via seed/admin.
2. Assim que o programa de afiliado for aprovado, obter da rede: URL de wrapper e o(s) parâmetro(s) de identificação do publisher.
3. `UPDATE stores SET "isAffiliate" = true, "affiliateBaseUrl" = '<wrapper com {url}>' WHERE slug = '<loja>';`
4. Nenhum redeploy de código é necessário — `/go/[productId]` lê `Store` a cada clique.
5. Testar: abrir `/go/{slug-de-um-produto-desta-loja}` e confirmar no `outbound_clicks` que `wasAffiliate = true` e que o `Location` do redirect é a URL de wrapper esperada.

## 5. Checklist para ativação em produção

- [ ] Programa de afiliado aprovado pela loja/rede
- [ ] ID de publisher/afiliado (ou equivalente) em mãos — **nunca inventado, sempre o valor real fornecido pela rede após aprovação**
- [ ] Formato exato do wrapper confirmado na documentação oficial da rede (nem todo programa usa `{url}` no mesmo lugar da querystring)
- [ ] `Store.affiliateBaseUrl` configurado e testado em ambiente de homologação
- [ ] `Store.isAffiliate = true` só depois do teste acima confirmar o redirect correto
- [ ] Cookie/prazo de atribuição e regra de comissão documentados na tabela da seção 6 (para negociação/conferência de repasse)
- [ ] `outbound_clicks.wasAffiliate` monitorado nos primeiros dias para confirmar que o clique está realmente saindo como afiliado

## 6. Auditoria técnica por loja/marca

Pesquisa feita em 2026-09 — nenhum dado abaixo foi inventado; onde a informação pública não permite confirmar um valor, está marcado como "não confirmado" em vez de um número estimado. Nenhuma destas lojas tem hoje `affiliateBaseUrl` configurado no banco — a coluna existe, mas está vazia para todas.

### Amazon

_(já existe como `Store` no banco — `isAffiliate: true`, `affiliateBaseUrl: null`)_

- **Possui programa de afiliados?** Sim — Amazon Associates (Programa de Associados), ativo no Brasil desde 2014.
- **Plataforma**: própria (SiteStripe/portal de Associados), sem wrapper de terceiro.
- **Documentação**: associados.amazon.com.br
- **Parâmetros necessários**: _tag_ de associado (ex.: `nossatag-20`), anexada como query param na própria URL do produto — ver nota técnica na seção 3.
- **Cookie**: 24 horas (comissão vale para qualquer compra feita na Amazon dentro desse período, não só o produto linkado).
- **Comissão**: variável por categoria, citada entre 1%–15% conforme a categoria (suplementos/saúde tende à faixa mais baixa desse intervalo — confirmar valor exato da categoria "Suplementos" no portal ao aprovar).
- **Aprovação**: cadastro gratuito, geralmente automática/rápida.
- **Prazo médio**: não confirmado com precisão nas fontes públicas consultadas — histórico do programa sugere aprovação em poucos dias.
- **Observações**: maior risco é a exigência da Amazon de gerar um volume mínimo de vendas nos primeiros 180 dias sob pena de desativação da conta — relevante para o timing de quando ativar.

### Netshoes

_(já existe como `Store` no banco — `isAffiliate: true`, `affiliateBaseUrl: null`)_

- **Possui programa de afiliados?** Sim — "Parceiro Netshoes" (relançamento do programa de afiliados).
- **Plataforma**: gerida pela **Rakuten Advertising**.
- **Documentação**: portal de afiliados da Rakuten Advertising (cadastro via a rede, não diretamente com a Netshoes).
- **Parâmetros necessários**: ID de publisher Rakuten + ID de anunciante (Netshoes) — obtidos após aprovação na Rakuten.
- **Cookie**: não confirmado com precisão nas fontes públicas consultadas.
- **Comissão**: até 13%, variável por categoria/pontuação do vendedor.
- **Aprovação**: via cadastro na Rakuten Advertising, sujeita a aprovação da Netshoes como anunciante dentro da rede.
- **Prazo médio**: não confirmado.
- **Observações**: Netshoes vende mais que suplementos (moda esportiva é o foco) — confirmar se o catálogo de suplementos específico participa do programa antes de assumir.

### Growth Supplements

_(marca já existe no catálogo — `growth-supplements`; **não existe como `Store`** hoje)_

- **Possui programa de afiliados?** Historicamente sim, listado como anunciante na **Lomadee** — status "inativo" em pelo menos uma fonte consultada em 2026, o que sugere que o programa direto pode estar pausado no momento da pesquisa.
- **Plataforma**: Lomadee.
- **Documentação**: developer.lomadee.com (deeplink) — formato confirmado, ver seção 3.
- **Parâmetros necessários**: `sourceId` (ID do afiliado na Lomadee) — obtido após aprovação.
- **Cookie**: 30 dias.
- **Comissão**: modelo CPA, taxa variável (não confirmado um percentual fixo nas fontes consultadas).
- **Aprovação**: cadastro na Lomadee + aprovação específica do anunciante Growth dentro da rede.
- **Prazo médio**: não confirmado.
- **Observações**: **confirmar status ativo/inativo do programa direto antes de negociar** — se estiver inativo, a alternativa citada nas fontes é vender produtos Growth via o programa da própria Amazon (já que a Amazon revende produtos da marca), sem precisar de acordo direto com a Growth.

### Soldiers Nutrition

_(marca **não existe** no catálogo hoje — precisa ser cadastrada em `Brand`/`Store` se for adicionada)_

- **Possui programa de afiliados?** Sim — lançado como programa próprio.
- **Plataforma**: **Awin**.
- **Documentação**: perfil do anunciante disponível na plataforma Awin (acesso após aprovação como publisher).
- **Parâmetros necessários**: `awinmid` (ID do anunciante Soldiers) + `awinaffid` (nosso ID de publisher Awin).
- **Cookie**: não especificado nas fontes consultadas para este anunciante especificamente (padrão Awin costuma ser configurável por anunciante).
- **Comissão**: 7,5% do valor final da compra.
- **Aprovação**: cadastro gratuito, maiores de 18 anos, sujeito a aprovação como publisher na Awin e depois aceite do anunciante.
- **Prazo médio**: não confirmado.
- **Observações**: programa relativamente novo (fontes de 2026); nenhum produto Soldiers está no catálogo do SupleCheck hoje — pré-requisito de catálogo antes de qualquer ativação.

### Dark Lab

_(marca **não existe** no catálogo hoje)_

- **Possui programa de afiliados?** Sim.
- **Plataforma**: **Awin**.
- **Documentação**: perfil do anunciante na Awin.
- **Parâmetros necessários**: `awinmid` (Dark Lab) + `awinaffid` (nosso).
- **Cookie**: 30 dias, atribuição "Last Click".
- **Comissão**: 5% CPA.
- **Aprovação**: via Awin.
- **Prazo médio**: não confirmado.
- **Observações**: **pagamento em Euro** (conversão pelo câmbio do Banco Central com dedução de 5% para custo de câmbio/transferência) — relevante para conciliação financeira, diferente das demais lojas desta lista, que pagam em Real. Não emite documento fiscal individual (DARF) para o afiliado — atenção fiscal a considerar antes de ativar.

### Integralmédica

_(marca já existe no catálogo — `integralmedica`; **não existe como `Store`** hoje)_

- **Possui programa de afiliados?** Não encontrado um programa de afiliados tradicional (comissão por indicação de terceiros) nas fontes públicas consultadas — o que existe é o **Integral Club**, um programa de fidelidade/cashback para o próprio consumidor final (não um programa de afiliados de conteúdo/mídia), mais parceria com o Livelo (pontos).
- **Plataforma**: N/A.
- **Documentação**: N/A.
- **Parâmetros necessários**: N/A.
- **Cookie**: N/A.
- **Comissão**: N/A.
- **Aprovação**: N/A.
- **Prazo médio**: N/A.
- **Observações**: **contatar diretamente o time comercial da Integralmédica** para confirmar se existe um programa de afiliados B2B não divulgado publicamente antes de descartar — a ausência de resultado de busca não é prova definitiva de inexistência.

### Max Titanium

_(marca já existe no catálogo — `max-titanium`; **não existe como `Store`** hoje)_

- **Possui programa de afiliados?** Sim, e há **dois programas distintos** encontrados — atenção para não confundir:
  1. **Max Titanium Affiliate Program** — modelo eCommerce CPA tradicional.
  2. **Max Team Influencers** — programa de influenciadores via plataforma BrandLovrs, com níveis (ex.: nível PRO).
- **Plataforma**: rede de afiliados eCommerce (CPA) para o programa 1; **BrandLovrs** para o programa 2.
- **Documentação**: não encontrada uma URL de documentação técnica pública direta nas fontes consultadas — recomenda-se contato direto com a marca para confirmar qual dos dois programas é o adequado para uma plataforma de comparação (o SupleCheck é mais próximo do perfil "afiliado eCommerce" do programa 1 do que "influenciador" do programa 2).
- **Parâmetros necessários**: não confirmado — depende de qual dos dois programas for confirmado como aplicável.
- **Cookie**: 30 dias (programa 1, "período de validação").
- **Comissão**: 3,8% por pedido válido (programa 1); programa 2 cita 10% + 2% sobre vendas totais no nível PRO, mais benefícios não-monetários (cartões-presente mensais).
- **Aprovação**: não confirmado.
- **Prazo médio**: não confirmado.
- **Observações**: há também um registro de reclamação pública sobre "não cumprimento dos benefícios" do programa de afiliados/influenciadores — vale considerar na negociação e exigir os termos por escrito.

### Adaptogen (Adaptogen Science)

_(marca **não existe** no catálogo hoje)_

- **Possui programa de afiliados?** Um programa existe, mas no formato **cupom de desconto de criador/influenciador**, não um link de afiliado tradicional com tracking por URL.
- **Plataforma**: própria (cadastro por formulário no site da marca).
- **Documentação**: adaptogen.com.br/parceiros-adaptogen
- **Parâmetros necessários**: **não aplicável no formato atual** — a atribuição é por cupom de desconto usado no checkout, não por parâmetro de URL. Isto **não se encaixa na arquitetura de `affiliateBaseUrl`** (que pressupõe redirecionamento rastreável por URL) sem uma adaptação — fora de escopo desta sprint.
- **Cookie**: N/A (atribuição por cupom, não por cookie).
- **Comissão**: 10% sobre vendas, condicionado a um mínimo de R$ 1.000,00 em vendas no mês.
- **Aprovação**: cadastro direto pelo site, aprovação manual não detalhada nas fontes.
- **Prazo médio**: não confirmado.
- **Observações**: se este programa for adotado no futuro, a arquitetura de `/go/` precisaria de uma extensão (exibir/aplicar um cupom em vez de/além de redirecionar) — vale registrar como um requisito técnico diferente do modelo de redirect atual, não uma simples configuração de `affiliateBaseUrl`.

### Demais lojas do banco — "Loja Oficial da Marca"

- Esta é uma **loja genérica de placeholder** (`isAffiliate: false`) usada no seed para representar "comprar direto com a marca" quando a loja real específica ainda não foi modelada — não é uma entidade comercial real a pesquisar. Conforme marcas específicas forem confirmadas com loja própria e programa de afiliado (Growth, Adaptogen, etc.), cada uma deve virar sua própria linha em `Store`, substituindo o uso genérico desta.

## 7. Resumo executivo da auditoria

| Loja/Marca         | No catálogo hoje?   | Programa confirmado?             | Rede                | Compatível com `{url}` sem adaptação? |
| ------------------ | ------------------- | -------------------------------- | ------------------- | ------------------------------------- |
| Amazon             | Store ✅            | ✅                               | Própria             | ⚠️ precisa de modo "anexar parâmetro" |
| Netshoes           | Store ✅            | ✅                               | Rakuten Advertising | ✅ (padrão wrapper)                   |
| Growth             | Brand ✅ / Store ❌ | ⚠️ possivelmente inativo         | Lomadee             | ✅                                    |
| Soldiers Nutrition | ❌                  | ✅                               | Awin                | ✅                                    |
| Dark Lab           | ❌                  | ✅                               | Awin                | ✅                                    |
| Integralmédica     | Brand ✅ / Store ❌ | ❌ não encontrado                | —                   | —                                     |
| Max Titanium       | Brand ✅ / Store ❌ | ✅ (2 programas, confirmar qual) | Não confirmada      | Provável ✅, a confirmar              |
| Adaptogen          | ❌                  | ✅ (formato cupom, não URL)      | Própria             | ❌ precisa de nova arquitetura        |
