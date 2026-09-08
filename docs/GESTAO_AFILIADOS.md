# Gestão de Afiliados — Guia Operacional

Este documento é o guia operacional de dia a dia para quem administra programas de afiliado no SupleScore: como adicionar uma loja, testar antes de ativar, auditar o que já está rodando e desligar/trocar um parceiro. A arquitetura técnica completa e a auditoria de programas por marca ficam em [`AFFILIATES.md`](../AFFILIATES.md) — este guia não repete aquele conteúdo, só referencia.

**Escopo desta sprint**: só documentação. Nenhum código, schema, API ou dado de produção foi alterado — nenhum `affiliateBaseUrl` real foi cadastrado. Nenhum ID/código de afiliado foi inventado em lugar nenhum deste guia ou de `AFFILIATES.md`.

---

## 1. Como adicionar uma nova loja

1. **Confirmar que a loja existe em `Store`** (`slug`, `name`). Se não existir, criar via seed ou API administrativa de catálogo (`/api/catalog`, protegida por `ADMIN_API_KEY` — ver `ARCHITECTURE.md`). Nenhuma loja nova precisa de deploy — é dado, não código.
2. **Confirmar que o programa de afiliado foi contratado/aprovado** pela rede ou diretamente pela marca (ver catálogo de integração na seção 3 abaixo e a auditoria completa em `AFFILIATES.md` §6).
3. **Obter da rede/marca**, só depois da aprovação:
   - a URL de wrapper (redes de deep-link: Awin, Lomadee, Rakuten...), **ou**
   - o parâmetro de tag/tracking (modelo Amazon — anexado à própria URL do produto).
4. **Nunca inventar ou estimar** esse valor — o campo `Store.affiliateBaseUrl` fica `null`/vazio até o valor real chegar.

## 2. Como configurar `affiliateBaseUrl`

`buildAffiliateUrl()` (`src/modules/monetization/lib/affiliateUrl.ts`) aceita exatamente dois formatos — nenhum outro:

| Formato                                       | Quando usar                                              | Exemplo (com ID fictício de exemplo, nunca um real)                |
| --------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------ |
| **Wrapper com `{url}`**                       | Redes de deep-link (Awin, Lomadee, Rakuten)              | `https://redir.lomadee.com/v2/deeplink?url={url}&sourceId=EXEMPLO` |
| **Querystring pura** (sem `{url}`, sem `://`) | Tag anexada à própria URL do produto (Amazon Associates) | `tag=exemplo-20`                                                   |

Ativação em produção é só um `UPDATE`:

```sql
UPDATE stores
SET "isAffiliate" = true,
    "affiliateBaseUrl" = '<formato acima, com o valor real fornecido pela rede/marca>'
WHERE slug = '<slug-da-loja>';
```

Nenhum redeploy é necessário — `/go/[productId]` lê `Store` a cada clique.

**Se o programa for por cupom de desconto (não por URL rastreável)** — caso confirmado hoje para Adaptogen e Probiótica, suspeito para Dux (ver `AFFILIATES.md` §6) — **não configure nada aqui**. Esse modelo não se encaixa em `affiliateBaseUrl` de forma alguma; precisaria de uma feature nova (exibir/aplicar cupom), fora do escopo desta arquitetura de redirect. Registrar como pendência de produto, não tentar forçar um valor.

## 3. Catálogo de integração — estrutura esperada por loja

Estrutura de parâmetros esperada, **não valores reais**. Onde a pesquisa pública não confirma um dado, está marcado como tal — nunca preenchido com um número estimado. Fonte completa (comissão, cookie, observações, riscos) está em `AFFILIATES.md` §6; esta tabela é só o resumo de "que tipo de parâmetro esperar".

| Loja/Marca             | Rede/Plataforma                         | Formato esperado                | Parâmetro(s) principais                                |
| ---------------------- | --------------------------------------- | ------------------------------- | ------------------------------------------------------ |
| **Amazon**             | Própria (Associates)                    | Querystring pura                | `tag` (tag de associado)                               |
| **Netshoes**           | Rakuten Advertising                     | Wrapper `{url}`                 | ID de publisher Rakuten + ID de anunciante             |
| **Growth Supplements** | Lomadee                                 | Wrapper `{url}`                 | `sourceId`                                             |
| **Integralmédica**     | Não confirmado (só fidelidade B2C hoje) | N/A                             | N/A — sem programa de afiliados de conteúdo confirmado |
| **Max Titanium**       | A confirmar (2 programas distintos)     | A confirmar                     | Depende de qual dos dois programas for adotado         |
| **Dux Nutrition**      | Própria (Programa de Influenciadores)   | A confirmar — indícios de cupom | Não confirmado se há link rastreável                   |
| **Probiótica**         | Brandlovers + Inbazz (SOU PRO)          | **Cupom — não é link de URL**   | Não aplicável a `affiliateBaseUrl`                     |
| **Darkness**           | Lomadee                                 | Wrapper `{url}`                 | `sourceId`                                             |
| **Adaptogen**          | Própria                                 | **Cupom — não é link de URL**   | Não aplicável a `affiliateBaseUrl`                     |

## 4. Como validar um link (antes de ativar em produção)

1. Configurar `affiliateBaseUrl` **primeiro em ambiente de homologação/local**, nunca direto em produção.
2. Pegar um produto real dessa loja no catálogo e montar a URL manualmente com um valor de teste do próprio provedor (se a rede oferecer um "link de teste" ou sandbox) ou o valor real já aprovado.
3. Confirmar visualmente que a URL final:
   - aponta para o domínio correto da loja/rede;
   - contém o parâmetro de tracking no lugar certo;
   - não quebra a URL de destino original (parâmetros da URL do produto continuam presentes).
4. Só then marcar `Store.isAffiliate = true` em produção.

## 5. Como testar um clique

1. Abrir no navegador: `/go/{slug-do-produto}?source=product-page` para um produto real dessa loja.
2. Confirmar o comportamento esperado:
   - **302** para a URL final (não 404, não 500);
   - a URL de destino (`Location` do redirect) é a URL de afiliado esperada, não a URL direta;
   - se o produto não tiver oferta cadastrada, o redirect cai para a página do produto (`no_offer`), nunca um link quebrado.
3. Confirmar no banco (ou no painel, seção 6 abaixo) que uma linha nova apareceu em `outbound_clicks` com `storeId` correto e `wasAffiliate = true`.
4. Repetir o teste **antes de qualquer troca de parâmetro** (rotação de tag, troca de rede) — nunca assumir que o novo valor funciona sem reconfirmar o clique real.

## 6. Como auditar `OutboundClick`

Duas formas, sem precisar de acesso direto ao banco:

- **Painel interno** (`/admin/metrics`, protegido por `ADMIN_API_KEY`, entregue na sprint de Monetização): mostra cliques totais, por loja, por produto, por categoria, produtos publicados sem nenhum clique e lojas de afiliado sem nenhum clique.
- **API** (`GET /api/admin/metrics`, mesma proteção) — mesmos dados em JSON, útil para relatório externo ou automação.

Leitura direta via SQL (uso pontual, quando o painel não cobre a pergunta):

```sql
-- Cliques de uma loja específica nos últimos 30 dias
SELECT count(*) FROM outbound_clicks
WHERE "storeId" = '<id-da-loja>' AND "createdAt" >= now() - interval '30 days';

-- Proporção de cliques que saíram como afiliado vs. não-afiliado
SELECT "wasAffiliate", count(*) FROM outbound_clicks
GROUP BY "wasAffiliate";
```

**O que não existe hoje**: rastreamento de impressão/visualização de card ou ranking — por isso não há CTR real (cliques ÷ visualizações). Um CTR sem esse denominador seria um número inventado; o painel deixa isso explícito em vez de estimar.

## 7. Como substituir um programa de afiliados

Quando uma loja troca de rede (ex.: sai da Awin, entra na Lomadee) ou renegocia a tag/ID:

1. **Não editar o `affiliateBaseUrl` antigo direto em produção primeiro.** Validar o novo valor em homologação (seção 4) e testar um clique real (seção 5).
2. Trocar em produção com uma única transação:
   ```sql
   UPDATE stores
   SET "affiliateBaseUrl" = '<novo formato/valor>'
   WHERE slug = '<slug-da-loja>';
   ```
3. Testar imediatamente um clique real em produção (seção 5) — não esperar até o próximo dia para confirmar.
4. Monitorar `outbound_clicks.wasAffiliate` nas horas seguintes — uma queda para `false` inesperada indica que o novo `affiliateBaseUrl` não bateu com nenhum dos dois formatos aceitos por `buildAffiliateUrl()` (revisar contra a seção 2).
5. Documentar a troca em `AFFILIATES.md` §6 (atualizar a entrada da loja) — o histórico de qual rede foi usada quando importa para conciliação financeira retroativa.

---

## 8. Checklist operacional — antes de ativar uma loja em produção

Nenhum item pode ser pulado. Marcar cada um explicitamente antes de `Store.isAffiliate = true` em produção:

- [ ] **Programa contratado** — aprovação confirmada pela rede/marca, ID real em mãos (nunca um valor placeholder).
- [ ] **`affiliateBaseUrl` configurado** em homologação, no formato correto (seção 2).
- [ ] **Testes aprovados** — link validado manualmente (seção 4): domínio correto, parâmetro no lugar certo, URL de destino não corrompida.
- [ ] **Clique registrado** — pelo menos um teste real de `/go/{produto}` gerou uma linha em `outbound_clicks` com o `storeId` certo.
- [ ] **Redirecionamento validado** — o `Location` do 302 é exatamente a URL de afiliado esperada, não a URL direta (`wasAffiliate = true` confirmado).
- [ ] **Métricas funcionando** — a loja aparece em `/admin/metrics` (ou na consulta SQL da seção 6) depois do clique de teste.

Só depois de todos os itens marcados: `UPDATE stores SET "isAffiliate" = true ...` em produção.

## 9. Guia de manutenção

### Como trocar um parceiro (mudar de rede para a mesma loja)

Ver seção 7 completa. Resumo: nunca trocar direto em produção sem testar em homologação primeiro; sempre confirmar um clique real depois da troca, não assumir que funcionou.

### Como desativar um afiliado

```sql
UPDATE stores SET "isAffiliate" = false WHERE slug = '<slug-da-loja>';
```

Isso não apaga `affiliateBaseUrl` (fica guardado para referência histórica) — só faz `buildAffiliateUrl()` cair para a URL normal (não-afiliada) em todo clique futuro para essa loja. Não afeta `OutboundClick` já gravado (histórico permanece intacto, é append-only).

**Quando desativar:**

- Programa suspenso/cancelado pela rede ou pela marca.
- Auditoria de link quebrado (seção abaixo) não resolvida em prazo razoável.
- Métricas mostram `wasAffiliate = false` de forma consistente mesmo com `isAffiliate = true` (sinal de que o `affiliateBaseUrl` parou de bater com o formato esperado — investigar antes de reativar).

### Como auditar links quebrados

1. Verificar no painel (`/admin/metrics`) produtos com zero clique recente apesar de estarem publicados — pode indicar que o link nunca funcionou, não necessariamente falta de interesse do usuário.
2. Testar manualmente um clique real (seção 5) para os produtos suspeitos dessa loja.
3. Se o redirect final (`Location`) devolver um erro HTTP na loja de destino (produto descontinuado, URL da loja mudou de estrutura), isso é um problema de `PriceEntry.url`, não do afiliado — reportar via o fluxo já existente de correção de dado (`politica-de-correcoes` no Trust Center, ou diretamente ajustando a captura de preço), não mexer em `affiliateBaseUrl`.
4. Se o redirect final funcionar mas **sem** o parâmetro de afiliado aparecer na URL (ex.: a rede mudou o formato do wrapper), o problema é o `affiliateBaseUrl` desatualizado — tratar como "substituir um programa" (seção 7), com o valor atualizado da rede.

### Como revisar programas expirados

Programas de afiliado têm renovação periódica (contratos, aprovações por período, mudança de política de comissão). Rotina recomendada, sem periodicidade fixa imposta por código (decisão comercial):

1. Revisitar `AFFILIATES.md` §6 e §8 a cada ciclo de revisão comercial — confirmar se o status "programa aprovado"/"cookie"/"comissão" registrado ainda é o vigente na rede.
2. Para lojas já ativas (`isAffiliate = true`), confirmar diretamente no portal da rede se o programa continua ativo — uma renovação perdida não gera nenhum erro técnico visível (o link continua redirecionando, só pode parar de gerar comissão do lado da rede).
3. Atualizar `AFFILIATES.md` com a data da última confirmação e qualquer mudança de termos (comissão, cookie) — histórico de quando cada dado foi confirmado evita decisão comercial baseada em informação desatualizada.
