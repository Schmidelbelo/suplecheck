# Monetização por Afiliados — Arquitetura e Auditoria de Programas

Este documento cobre a arquitetura de monetização por afiliados do SupleScore (implementada) e uma auditoria técnica dos programas de afiliado reais das lojas/marcas prioritárias (pesquisa, sem nenhuma integração ativada ainda).

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
| **Amazon Associates**   | Sem wrapper — a _tag_ é anexada como query param na PRÓPRIA URL amazon.com.br (`?...&tag=nossa-tag-20`), não uma URL de terceiro | ✅ — segundo formato de `affiliateBaseUrl` (querystring pura, sem `{url}`), ver nota abaixo                  |

**Nota técnica sobre Amazon — RESOLVIDA nesta sprint**: o modelo de tag da Amazon não é um wrapper, então `{url}` sozinho não cobria o caso de "acrescentar `&tag=` a uma URL que talvez já tenha ou não outros parâmetros". `buildAffiliateUrl()` agora aceita um segundo formato de `affiliateBaseUrl`: uma querystring pura (sem `{url}`, sem `://`), ex. `"tag=nossatag-20"`, mesclada nos parâmetros já existentes da URL de destino em vez de substituir um template. Nenhum valor real foi inventado — o campo continua vazio no banco até a aprovação no programa Amazon Associates; ver testes em `affiliateUrl.test.ts`.

## 4. Como adicionar uma nova loja

1. Confirmar que a loja já existe em `Store` (`slug`, `name`) — se não existir, criar via seed/admin.
2. Assim que o programa de afiliado for aprovado, obter da rede: URL de wrapper e o(s) parâmetro(s) de identificação do publisher.
3. `UPDATE stores SET "isAffiliate" = true, "affiliateBaseUrl" = '<wrapper com {url}, ou querystring pura para redes de tag própria como Amazon>' WHERE slug = '<loja>';`
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
- **Observações**: programa relativamente novo (fontes de 2026); nenhum produto Soldiers está no catálogo do SupleScore hoje — pré-requisito de catálogo antes de qualquer ativação.

### Dark Lab

_(marca já existe no catálogo — `dark-lab`; não existe como `Store` hoje)_

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

_(marca já existe no catálogo — `integralmedica`; **existe como `Store`** — `integralmedica-oficial`, `isAffiliate: false`, `affiliateBaseUrl` aponta para o domínio oficial da marca (loja direta, não um link de afiliado) — criada para o fluxo de captura de preço, não para monetização por afiliado)_

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

_(marca já existe no catálogo — `max-titanium`; **existe como `Store`** — `max-titanium-oficial`, `isAffiliate: false`, `affiliateBaseUrl` aponta para o domínio oficial da marca, mesma natureza de loja direta descrita para a Integralmédica acima, não um programa de afiliado ativado)_

- **Possui programa de afiliados?** Sim, e há **dois programas distintos** encontrados — atenção para não confundir:
  1. **Max Titanium Affiliate Program** — modelo eCommerce CPA tradicional.
  2. **Max Team Influencers** — programa de influenciadores via plataforma BrandLovrs, com níveis (ex.: nível PRO).
- **Plataforma**: rede de afiliados eCommerce (CPA) para o programa 1; **BrandLovrs** para o programa 2.
- **Documentação**: não encontrada uma URL de documentação técnica pública direta nas fontes consultadas — recomenda-se contato direto com a marca para confirmar qual dos dois programas é o adequado para uma plataforma de comparação (o SupleScore é mais próximo do perfil "afiliado eCommerce" do programa 1 do que "influenciador" do programa 2).
- **Parâmetros necessários**: não confirmado — depende de qual dos dois programas for confirmado como aplicável.
- **Cookie**: 30 dias (programa 1, "período de validação").
- **Comissão**: 3,8% por pedido válido (programa 1); programa 2 cita 10% + 2% sobre vendas totais no nível PRO, mais benefícios não-monetários (cartões-presente mensais).
- **Aprovação**: não confirmado.
- **Prazo médio**: não confirmado.
- **Observações**: há também um registro de reclamação pública sobre "não cumprimento dos benefícios" do programa de afiliados/influenciadores — vale considerar na negociação e exigir os termos por escrito.

### Adaptogen (Adaptogen Science)

_(marca já existe no catálogo — `adaptogen`; não existe como `Store` hoje)_

- **Possui programa de afiliados?** Um programa existe, mas no formato **cupom de desconto de criador/influenciador**, não um link de afiliado tradicional com tracking por URL.
- **Plataforma**: própria (cadastro por formulário no site da marca).
- **Documentação**: adaptogen.com.br/parceiros-adaptogen
- **Parâmetros necessários**: **não aplicável no formato atual** — a atribuição é por cupom de desconto usado no checkout, não por parâmetro de URL. Isto **não se encaixa na arquitetura de `affiliateBaseUrl`** (que pressupõe redirecionamento rastreável por URL) sem uma adaptação — fora de escopo desta sprint.
- **Cookie**: N/A (atribuição por cupom, não por cookie).
- **Comissão**: 10% sobre vendas, condicionado a um mínimo de R$ 1.000,00 em vendas no mês.
- **Aprovação**: cadastro direto pelo site, aprovação manual não detalhada nas fontes.
- **Prazo médio**: não confirmado.
- **Observações**: se este programa for adotado no futuro, a arquitetura de `/go/` precisaria de uma extensão (exibir/aplicar um cupom em vez de/além de redirecionar) — vale registrar como um requisito técnico diferente do modelo de redirect atual, não uma simples configuração de `affiliateBaseUrl`.

### Dux Nutrition

_(marca já existe no catálogo — `dux`; **existe como `Store`** — `dux-oficial`, `isAffiliate: false`, `affiliateBaseUrl` aponta para `duxhumanhealth.com` — loja direta para captura de preço, mesma natureza das entradas de Integralmédica/Max Titanium, não um programa de afiliado ativado)_

- **Possui programa de afiliados?** Sim — "Programa de Influenciadores DUX", plataforma própria (`afiliados.duxnutrition.com` / `influenciadores.duxnutrition.com`).
- **Plataforma**: própria (não é uma rede de afiliados terceirizada como Awin/Lomadee/Rakuten).
- **Documentação**: `afiliados.duxnutrition.com` (portal de cadastro).
- **Parâmetros necessários**: **não confirmado se o programa gera link rastreável por URL ou funciona por cupom de desconto** — as fontes públicas descrevem benefícios de desconto (40% em produtos DUX Human Health/Eat Clean) e comissão (10%) associados a posts/divulgação, o que é característico de um modelo de influenciador com cupom, não de link de afiliado com wrapper. **Precisa confirmação direta com a marca antes de assumir compatibilidade com `affiliateBaseUrl`** — se for cupom, tem a mesma limitação já registrada para a Adaptogen (seção sobre Adaptogen).
- **Cookie**: não confirmado.
- **Comissão**: 10% sobre vendas citado nas fontes, mais benefícios não-monetários (produtos grátis, vale-presentes) — condições exatas não confirmadas.
- **Aprovação**: cadastro no portal próprio, aprovação não detalhada.
- **Prazo médio**: não confirmado.
- **Observações**: **confirmar com o time comercial da Dux se existe, em paralelo, um programa de afiliados eCommerce tradicional (link rastreável) além do programa de influenciadores** antes de descartar compatibilidade com a arquitetura atual.

### Probiótica

_(marca já existe no catálogo — `probiotica`; **não existe como `Store`** hoje)_

- **Possui programa de afiliados?** Sim — "Parceiros Probiótica" / programa "SOU PRO", voltado a profissionais de educação física e embaixadores da marca.
- **Plataforma**: gestão via **Brandlovers** (candidatura) com pagamento de comissão processado pela plataforma **Inbazz**.
- **Documentação**: `probiotica.com.br/soupro` e `probiotica.com.br/parceiros-probiotica`.
- **Parâmetros necessários**: **não aplicável no formato de `affiliateBaseUrl`** — a atribuição confirmada é por **cupom de desconto exclusivo do embaixador**, não por link/URL rastreável. Mesma limitação estrutural já registrada para a Adaptogen: não se encaixa no modelo de redirect atual sem uma feature nova (exibir/aplicar cupom).
- **Cookie**: N/A (atribuição por cupom, não por cookie).
- **Comissão**: 10% sobre vendas feitas com o cupom exclusivo do embaixador.
- **Aprovação**: candidatura na Brandlovers, sujeita a aprovação como embaixador ativo na comunidade SOU PRO.
- **Prazo médio**: não confirmado.
- **Observações**: como a Adaptogen, este programa é de **marketing de influência com cupom**, não de afiliação por link — fora do escopo do `/go/` atual sem uma extensão de produto dedicada.

### Darkness

_(marca já existe no catálogo — `darkness`; **não existe como `Store`** hoje)_

- **Possui programa de afiliados?** Sim — listada como anunciante ativo na **Lomadee** (`lomadee.com.br/anunciante/darkness`).
- **Plataforma**: Lomadee — mesmo formato de deep-link já confirmado e suportado pela arquitetura (ver seção 3, linha da Lomadee).
- **Documentação**: `developer.lomadee.com` (deeplink, já documentado nesta arquitetura) + página do anunciante Darkness na Lomadee.
- **Parâmetros necessários**: `sourceId` (ID do afiliado na Lomadee) — obtido após aprovação, igual ao modelo já usado para a Growth.
- **Cookie**: não confirmado especificamente para o anunciante Darkness (padrão Lomadee costuma variar por anunciante).
- **Comissão**: não confirmado um percentual específico do anunciante Darkness nas fontes públicas consultadas.
- **Aprovação**: cadastro na Lomadee + aprovação do anunciante Darkness dentro da rede.
- **Prazo médio**: não confirmado.
- **Observações**: **Darkness é uma linha/submarca da Integralmédica** (fabricada e distribuída pela mesma empresa) — relevante para a entrada já registrada de Integralmédica nesta auditoria: o programa de afiliados tradicional pode não existir para a marca-mãe, mas existe para esta submarca especificamente via Lomadee. Vale reconfirmar isso com o time comercial antes de tratar as duas marcas como equivalentes em termos de monetização.

### Demais lojas do banco — "Loja Oficial da Marca"

- Esta é uma **loja genérica de placeholder** (`isAffiliate: false`) usada no seed para representar "comprar direto com a marca" quando a loja real específica ainda não foi modelada — não é uma entidade comercial real a pesquisar. Conforme marcas específicas forem confirmadas com loja própria e programa de afiliado (Growth, Adaptogen, etc.), cada uma deve virar sua própria linha em `Store`, substituindo o uso genérico desta.

## 7. Resumo executivo da auditoria

| Loja/Marca         | No catálogo hoje?                  | Programa confirmado?             | Rede                | Compatível com `{url}` sem adaptação?                   |
| ------------------ | ---------------------------------- | -------------------------------- | ------------------- | ------------------------------------------------------- |
| Amazon             | Store ✅                           | ✅                               | Própria             | ✅ (modo "anexar parâmetro", implementado nesta sprint) |
| Netshoes           | Store ✅                           | ✅                               | Rakuten Advertising | ✅ (padrão wrapper)                                     |
| Growth             | Brand ✅ / Store ❌                | ⚠️ possivelmente inativo         | Lomadee             | ✅                                                      |
| Soldiers Nutrition | ❌                                 | ✅                               | Awin                | ✅                                                      |
| Dark Lab           | Brand ✅ / Store ❌                | ✅                               | Awin                | ✅                                                      |
| Integralmédica     | Brand ✅ / Store ✅ (não-afiliada) | ❌ não encontrado                | —                   | —                                                       |
| Max Titanium       | Brand ✅ / Store ✅ (não-afiliada) | ✅ (2 programas, confirmar qual) | Não confirmada      | Provável ✅, a confirmar                                |
| Dux Nutrition      | Brand ✅ / Store ✅ (não-afiliada) | ⚠️ provável cupom, a confirmar   | Própria             | ❌ provável (a confirmar)                               |
| Probiótica         | Brand ✅ / Store ❌                | ✅ (formato cupom, não URL)      | Brandlovers/Inbazz  | ❌ precisa de nova arquitetura                          |
| Darkness           | Brand ✅ / Store ❌                | ✅                               | Lomadee             | ✅                                                      |
| Adaptogen          | Brand ✅ / Store ❌                | ✅ (formato cupom, não URL)      | Própria             | ❌ precisa de nova arquitetura                          |

## 8. Tabela única de preparação comercial

Cobre as 3 lojas hoje cadastradas em `Store` (as únicas com produto/preço real no catálogo) e as marcas/lojas pesquisadas para expansão futura. "AffiliateBaseUrl esperado" é o **formato**, não um valor — nenhum ID real existe ainda; o campo continua `null` no banco para todas.

| Loja                      | Programa                                                           | Status                                                              | Cadastro?                     | Aprovação?                                         | Extensão?                                                         | API?                    | `AffiliateBaseUrl` esperado (formato)                                                | Observações                                                                                          |
| ------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- | ----------------------------- | -------------------------------------------------- | ----------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **Amazon**                | Amazon Associates                                                  | No catálogo, `isAffiliate: true`                                    | Sim (grátis, portal próprio)  | Sim (geralmente automática/rápida)                 | Não — implementado nesta sprint (modo "anexar parâmetro")         | Não                     | `"tag=NOSSA-TAG-20"` (querystring pura)                                              | Risco de desativação por volume mínimo de vendas em 180 dias — considerar timing de ativação.        |
| **Netshoes**              | Parceiro Netshoes (via Rakuten Advertising)                        | No catálogo, `isAffiliate: true`                                    | Sim (via Rakuten Advertising) | Sim (Rakuten + aceite da Netshoes como anunciante) | Não — formato wrapper já suportado                                | Não (portal da Rakuten) | `"https://track.rakuten.../click?...&u={url}"` (formato exato a confirmar no portal) | Confirmar se o catálogo de suplementos específico participa do programa.                             |
| **Loja Oficial da Marca** | N/A — placeholder de seed                                          | No catálogo, `isAffiliate: false`                                   | N/A                           | N/A                                                | N/A                                                               | N/A                     | N/A                                                                                  | Não é entidade comercial real; substituir por lojas específicas conforme forem confirmadas.          |
| **Growth Supplements**    | Programa próprio via Lomadee                                       | Fora do catálogo (`Brand` existe, `Store` não)                      | Sim (Lomadee)                 | Sim (Lomadee + aceite do anunciante)               | Não — formato wrapper já suportado                                | Não                     | `"https://redir.lomadee.com/v2/deeplink?url={url}&sourceId=NOSSO_ID"`                | Status do programa direto "possivelmente inativo" numa fonte — confirmar antes de negociar.          |
| **Soldiers Nutrition**    | Programa próprio via Awin                                          | Fora do catálogo (`Brand` não existe)                               | Sim (Awin)                    | Sim (Awin + aceite do anunciante)                  | Não — formato wrapper já suportado                                | Não                     | `"https://www.awin1.com/cread.php?awinmid=X&awinaffid=NOSSO_ID&ued={url}"`           | Nenhum produto Soldiers no catálogo hoje — pré-requisito antes de ativar.                            |
| **Dark Lab**              | Programa próprio via Awin                                          | Fora da monetização (`Brand` existe, `Store` não)                   | Sim (Awin)                    | Sim (Awin + aceite do anunciante)                  | Não — formato wrapper já suportado                                | Não                     | `"https://www.awin1.com/cread.php?awinmid=X&awinaffid=NOSSO_ID&ued={url}"`           | Comissão paga em Euro — atenção à conciliação financeira e fiscal.                                   |
| **Integralmédica**        | Não encontrado (só fidelidade B2C, "Integral Club")                | `Store` existe (`integralmedica-oficial`, loja direta não-afiliada) | —                             | —                                                  | —                                                                 | —                       | —                                                                                    | Confirmar diretamente com o time comercial da marca antes de descartar.                              |
| **Max Titanium**          | 2 programas distintos (eCommerce CPA / BrandLovrs influenciadores) | `Store` existe (`max-titanium-oficial`, loja direta não-afiliada)   | A confirmar qual dos dois     | A confirmar                                        | Provavelmente não (perfil eCommerce CPA é compatível com wrapper) | A confirmar             | A confirmar após decidir qual programa                                               | Confirmar qual dos dois programas antes de qualquer contato comercial.                               |
| **Dux Nutrition**         | Programa de Influenciadores DUX (plataforma própria)               | `Store` existe (`dux-oficial`, loja direta não-afiliada)            | Sim (portal próprio)          | Não detalhado                                      | Provável — indícios de modelo cupom/desconto, a confirmar         | Não                     | A confirmar após esclarecer se há link rastreável                                    | Confirmar com a marca se existe programa eCommerce tradicional além do de influenciadores.           |
| **Probiótica**            | SOU PRO / Parceiros Probiótica (Brandlovers + Inbazz)              | Fora do catálogo (`Brand` existe, `Store` não)                      | Sim (candidatura Brandlovers) | Sim (aprovação como embaixador ativo)              | **Sim — atribuição por cupom, não por URL**                       | Não                     | Não aplicável no contrato atual                                                      | Mesma limitação estrutural da Adaptogen — precisaria de feature de cupom, não de configuração.       |
| **Darkness**              | Programa via Lomadee (submarca da Integralmédica)                  | Fora do catálogo (`Brand` existe, `Store` não)                      | Sim (Lomadee)                 | Sim (Lomadee + aceite do anunciante)               | Não — formato wrapper já suportado                                | Não                     | `"https://redir.lomadee.com/v2/deeplink?url={url}&sourceId=NOSSO_ID"`                | Confirmar se o programa cobre a linha de whey já publicada no catálogo.                              |
| **Adaptogen**             | Cupom de desconto (não é link rastreável por URL)                  | Fora da monetização (`Brand` existe, `Store` não)                   | Sim (formulário próprio)      | Não detalhado                                      | **Sim — modelo de cupom não se encaixa no redirect atual**        | Não                     | Não aplicável no contrato atual                                                      | Precisaria de uma feature nova (exibir/aplicar cupom), fora do escopo desta arquitetura de redirect. |

## 9. Confirmação: nenhum ajuste técnico pendente para as lojas ativas

Revisão da arquitetura completa (`affiliateUrl.ts`, `outboundLinkHref.ts`, `outboundClick.service.ts`, `/go/[productId]/route.ts`) confirma:

- **Amazon** e **Netshoes** — as 2 lojas de afiliado já no catálogo — têm hoje suporte técnico completo (wrapper e "anexar parâmetro"). Ativação após aprovação é puramente um `UPDATE` de `Store.isAffiliate`/`Store.affiliateBaseUrl`, sem deploy de código.
- **Growth, Soldiers Nutrition, Dark Lab** usam o formato wrapper já suportado — nenhuma extensão necessária quando (e se) entrarem no catálogo.
- **Adaptogen** é a única exceção real: seu programa não é rastreável por URL (cupom), então não se encaixa em `affiliateBaseUrl` de forma alguma — precisaria de uma feature nova, não uma configuração. Não implementado — o requisito é de outra natureza (exibição de cupom, não redirecionamento), independentemente de a marca já ter produto publicado no catálogo (`adaptogen-tasty-whey-3w-900g`).
- **Integralmédica** e **Max Titanium** não têm formato técnico a validar ainda (falta confirmar se há programa e qual, respectivamente) — sem impacto na arquitetura até essa confirmação comercial.
- A arquitetura continua funcionando com `affiliateBaseUrl` vazio para todas as lojas — comportamento hoje em produção, coberto pelos testes de fallback em `affiliateUrl.test.ts`.

### Campos a preencher quando cada programa for aprovado (nenhum ajuste de código)

Para cada loja, só isto muda no banco:

```sql
UPDATE stores
SET "isAffiliate" = true,
    "affiliateBaseUrl" = '<formato conforme a tabela da seção 8, com o ID real fornecido pela rede>'
WHERE slug = '<slug-da-loja>';
```
