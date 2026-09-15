# Primeira Receita Real — Checklist, Relatório e Smoke Test

Este documento reúne tudo que falta, e só isso, entre o estado atual do projeto
(build/testes verdes, painel de monetização e Central de Imagens entregues) e a
primeira comissão de afiliado real em produção. Nenhum link, token ou dado de
loja aqui é inventado — todo campo marcado `<fornecer>` precisa ser preenchido
por quem tem acesso real ao painel do provedor.

---

## 1. Checklist operacional de produção

Ordem recomendada — cada passo depende do anterior.

### 1.1 Conectar o Vercel Blob Store

- [ ] Painel da Vercel → projeto → **Storage** → **Create Database** → **Blob**.
- [ ] Confirmar que `BLOB_READ_WRITE_TOKEN` foi injetado automaticamente no
      ambiente de produção (Vercel faz isso sozinho ao conectar o store).
- [ ] Para testar localmente antes do deploy: `vercel env pull .env.local`
      depois de conectar (ou colar o token manualmente em `.env.local`).
- [ ] Confirmar com uma chamada real: `GET /api/admin/images/pending`
      (com `x-api-key`) deve continuar respondendo 200 normalmente — esse
      endpoint não depende do Blob, só confirma que o deploy está saudável
      antes do próximo passo.

### 1.2 Publicar os `PendingImage` já aprovados

- [ ] Abrir `/admin/imagens`, informar a `ADMIN_API_KEY`.
- [ ] Conferir que a fila carregou (hoje: 20 `APPROVED`, 17 `PENDING` sem
      candidato — o guardrail roda sozinho a cada carregamento da página).
- [ ] Publicar **1 candidato isolado** primeiro (botão "Publicar no Blob" em
      qualquer card `APPROVED`) — confirma que o pipeline downloads→WEBP→Blob
      funciona de ponta a ponta antes de rodar todo o lote.
- [ ] Se o item sumir da fila sem erro no toast: publicar o restante com
      **"Publicar todos os aprovados"**.
- [ ] Alternativa via API direta (útil em CI/script):
      `curl -X POST https://<domínio>/api/admin/images/publish-all -H "x-api-key: $ADMIN_API_KEY"`

### 1.3 Validar queda de placeholders/cards

- [ ] `GET /api/admin/images/pending` — o campo `items` deve ter caído de 37
      para próximo de 17 (os que continuam sem candidato, listados na seção 4
      abaixo — nenhum deles é publicável sem pesquisa/upload manual antes).
- [ ] Abrir 2–3 páginas de produto que estavam com `-card.webp` (ex.:
      `/creatina/vitafor-creatina-300g`, `/categorias/creatina/max-titanium-creatina-300g`)
      e confirmar visualmente que a foto real substituiu o card gerado.
- [ ] Os 17 que continuam `PENDING` (sem candidato) continuam mostrando o
      card ilustrativo — isso é esperado e honesto, não é bug.

### 1.4 Configurar a primeira loja afiliada real

- [ ] Ter em mãos o `affiliateBaseUrl` real (vindo do painel do programa de
      afiliados já aprovado/contratado — nunca estimado).
- [ ] Rodar em **dry-run** primeiro (ver seção 2) pra conferir antes/depois
      sem gravar nada.
- [ ] Rodar de verdade (`prisma/configureStoreAffiliate.ts`, sem `DRY_RUN`).
- [ ] Recarregar `/admin/monetizacao` e confirmar que a loja saiu da lista de
      "próxima ação recomendada" e a cobertura geral subiu.

### 1.5 Validar `/go` em produção

- [ ] Ver seção 5 (smoke test) — é o mesmo roteiro, só rodado contra o
      domínio de produção em vez de `localhost`.

---

## 2. Script de ativação de loja afiliada (com dry-run)

`prisma/configureStoreAffiliate.ts` — já existente, sem alteração de
comportamento além do dry-run novo.

```bash
# Simula sem gravar nada — sempre rodar isto primeiro
STORE_SLUG=netshoes AFFILIATE_BASE_URL="<link/tag real>" DRY_RUN=1 \
  npx tsx prisma/configureStoreAffiliate.ts

# Grava de verdade (sem DRY_RUN, ou DRY_RUN=0)
STORE_SLUG=netshoes AFFILIATE_BASE_URL="<link/tag real>" \
  npx tsx prisma/configureStoreAffiliate.ts
```

Garantias do script (inalteradas):

- Valida que a loja existe antes de qualquer escrita — sai com erro claro se não.
- Imprime **ANTES** e **DEPOIS** (ou **DEPOIS (simulado)** em dry-run).
- Só grava `isAffiliate=true` e `affiliateBaseUrl` da loja apontada por
  `STORE_SLUG` — nenhuma outra linha da tabela `Store` é tocada.
- Aceita os dois formatos que `buildAffiliateUrl` reconhece: querystring pura
  (`tag=...`, modelo Amazon) ou wrapper com `{url}` (Awin/Lomadee/Rakuten).

---

## 3. Relatório — lojas prioritárias para ativação

Gerado a partir de `getMonetizationAudit()` (mesmo dado que `/admin/monetizacao`
mostra). Cobertura atual: **15/61 produtos monetizados (24,6%)**.

| storeSlug             | storeName             | Com preço | Bloqueados | Motivo                                                                                     | Impacto se destravar |
| --------------------- | --------------------- | --------- | ---------- | ------------------------------------------------------------------------------------------ | -------------------- |
| `loja-oficial`        | Loja Oficial da Marca | 9         | 9          | `STORE_NOT_AFFILIATE`                                                                      | +14,8pp → 39,3%      |
| `essencia-brasileira` | Essência Brasileira   | 3         | 3          | `STORE_NOT_AFFILIATE`                                                                      | +4,9pp → 29,5%       |
| `mercado-livre`       | Mercado Livre         | 3         | 3          | `STORE_NOT_AFFILIATE`                                                                      | +4,9pp → 29,5%       |
| `fastfit-suplementos` | Fast Fit Suplementos  | 2         | 2          | `STORE_NOT_AFFILIATE`                                                                      | +3,3pp → 27,9%       |
| `vitafor-oficial`     | Loja Oficial Vitafor  | 2         | 2          | `STORE_NOT_AFFILIATE` (já tem `affiliateBaseUrl` configurado, só falta `isAffiliate=true`) | +3,3pp → 27,9%       |
| `dux-oficial`         | Loja Oficial Dux      | 2         | 2          | `STORE_NOT_AFFILIATE`                                                                      | +3,3pp → 27,9%       |

**`netshoes` não entra no top-6 por volume** (destrava só 1 produto — Creatina
Probiótica 300g, R$44,90) mas continua sendo a **única ativação de esforço
zero**: `isAffiliate` já é `true`, falta só o `affiliateBaseUrl` real — nenhuma
decisão comercial nova necessária, só o link.

`loja-oficial` é o maior grupo (9 produtos, várias marcas diferentes) porque
hoje é usado como fallback genérico para lojas próprias das marcas sem
programa de afiliado individual confirmado — ativar essa entrada não é
recomendado sem antes confirmar produto a produto se cada marca realmente tem
o mesmo programa (ver `docs/GESTAO_AFILIADOS.md` §1).

---

## 4. Produtos ainda sem candidato de imagem (17)

Não fazem parte do escopo de imagem publicável nesta rodada — precisam de
pesquisa manual nova ou upload direto via `/admin/imagens`. Ver motivo
completo de cada um em `PendingImage.reason` (mesmo dado exposto por
`GET /api/admin/images/pending`).

---

## 5. Smoke test de produção

Roteiro manual, ~5 minutos, rodar logo após cada deploy que toque
monetização ou imagens.

1. **`/admin/monetizacao`** — abre, pede a `ADMIN_API_KEY`, carrega sem erro.
   Cobertura geral bate com o esperado (sobe depois do passo 4 do checklist).
2. **`/admin/imagens`** — abre, fila carrega, guardrail não acusa erro no toast.
3. **Publicar 1 imagem aprovada** — clicar "Publicar no Blob" em um card
   `APPROVED`; o item some da fila, toast de sucesso.
4. **Publicar lote** — clicar "Publicar todos os aprovados"; contagem de
   publicados/pulados aparece no toast, fila atualiza.
5. **Abrir o ranking** (`/creatina` ou `/categorias/<slug>`) — confirmar que
   o botão **"Ver oferta"** aparece nos produtos com preço.
6. **Clicar "Ver oferta"** — deve abrir em nova aba e redirecionar (302) para
   a loja real (afiliada ou não, dependendo da loja do produto clicado).
7. **Confirmar o redirect passou por `/go`** — a URL na barra de navegação
   antes do redirect era `/go/<slug>?source=...`, nunca um link direto pra
   loja.
8. **Confirmar `OutboundClick` criado** — via `/admin/monetizacao` (a
   cobertura/contagem não muda, mas o clique fica registrado) ou consultando
   a tabela diretamente; o campo `wasAffiliate` deve ser `true` só para lojas
   com `isAffiliate=true` e `affiliateBaseUrl` configurado.

Se qualquer passo falhar, **não prosseguir pro próximo** — o pipeline inteiro
(descoberta → aprovação → Blob → banco → `/go` → `OutboundClick`) depende dos
passos anteriores terem funcionado de verdade, não só "parecerem" ok.
