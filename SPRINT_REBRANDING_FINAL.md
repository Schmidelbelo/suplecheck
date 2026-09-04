# Sprint de Rebranding — Relatório Final (SupleCheck → SupleScore)

Data do encerramento: 2026-09-04
Commit do rebranding: `fbb3c69` — `rebrand: SupleCheck -> SupleScore`

## 1. O que foi entregue nesta sprint

- Substituição completa de "SupleCheck" por "SupleScore" em interface, metadata, SEO, OpenGraph, Twitter Cards, JSON-LD (`Organization`, `Product`/`Review`, `WebSite`/`SearchAction`), `robots.txt`, os 4 sitemaps segmentados, logotipo textual (`Logo.tsx` e `brandMark.tsx` — inclusive as imagens OG/Twitter/ícones PWA geradas via `next/og`), todas as páginas institucionais (sobre, metodologia, como avaliamos, como ganhamos dinheiro, contato, privacidade, cookies, termos), README, ARCHITECTURE.md e demais documentação técnica (`docs/`, `packages/*/ARCHITECTURE.md`).
- `NEXT_PUBLIC_SITE_URL`: fallback padrão em `src/config/site.ts` atualizado para `https://www.suplescore.com.br`, deixado preparado para quando o DNS propagar.
- `package.json` raiz renomeado para `suplescore`; `package-lock.json` resincronizado.
- Chaves de `localStorage` (favoritos, histórico, alertas de preço, e-mail capturado, sessão de admin) migradas do prefixo `suplecheck:` para `suplescore:`.
- Preservados deliberadamente, por serem identificadores internos de arquitetura e não texto de marca: os escopos de pacote do monorepo (`@suplecheck/core`, `@suplecheck/application`, `@suplecheck/infrastructure`) e a classe de domínio `SupleCheckIndexResult`. Nenhuma tabela/coluna/model do banco foi renomeada — só comentários no `schema.prisma`.

## 2. Arquivos modificados

| Sprint     | Commit    | Arquivos | Linhas      |
| ---------- | --------- | -------- | ----------- |
| Rebranding | `fbb3c69` | 94       | +318 / −228 |

Distribuição por tipo no commit de rebranding: 38 `.tsx`, 35 `.ts`, 14 `.md`, 5 `.json`, 1 `.prisma`, 1 `.css`.

Commits da sprint de rebranding e imediatamente anteriores (contexto):

```
fbb3c69 rebrand: SupleCheck -> SupleScore
bfd9c3f fix(deploy): gera prisma client antes do build
9b0a068 docs(beta): adiciona operacao do beta publico
784ab8d feat(monetizacao): suporta tags de afiliado em query string
```

## 3. Auditoria final — Ocorrências de marca

Busca por `SupleCheck`/`suplecheck`/`SUPLECHECK` (case-insensitive) em código, comentários, documentação, constantes, variáveis, testes, mensagens, metadata, seeds, migrations e arquivos ocultos.

**Resultado: limpo, com 3 categorias de exceção, todas documentadas e deliberadas:**

| Onde                                                                                                                                                          | O que é                                                                                    | Por que ficou                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@suplecheck/core`, `@suplecheck/application`, `@suplecheck/infrastructure` (6 arquivos: `package.json` dos 3 pacotes + 3 arquivos de código que os importam) | Escopo de pacote npm interno do monorepo                                                   | Identificador de arquitetura/resolução de módulo, não texto de marca. Renomear exigiria tocar imports, `package.json` de cada pacote e reinstalar o workspace — fora do escopo ("não alterar arquitetura") |
| `SupleCheckIndexResult` (9 arquivos: a classe, seu arquivo, e todo import/uso em `core`/`application`/`infrastructure`/docs)                                  | Classe de domínio (aggregate do cálculo de score)                                          | Mesma razão — identificador técnico interno, não string de marca visível ao usuário                                                                                                                        |
| `CHANGELOG.md`                                                                                                                                                | Entradas históricas de versões anteriores (`[0.1.0]`–`[0.8.0]`) que mencionam "SupleCheck" | Registro histórico correto — um changelog não deve reescrever o passado                                                                                                                                    |

- **Banco de dados**: nenhuma ocorrência em dados reais (`Store.name`, `Store.slug`, `Lead.source` consultados diretamente — todos limpos). Nenhuma migration ou seed contém o nome antigo além dos comentários já cobertos no schema.
- **Arquivos ocultos/gitignored**: `.env.production.local` (snapshot local do Vercel, nunca commitado) ainda referencia `suplecheck.vercel.app` e o slug de projeto `suplecheck` na Vercel — ver Pendências Externas (§6).

## 4. Auditoria de dívida técnica (TODO/FIXME/mock/dead code)

- **TODO / FIXME / HACK / XXX**: nenhuma ocorrência real. As únicas batidas de busca foram falsos positivos — a palavra portuguesa "todo/TODOS" (= "all/every") e o placeholder de exemplo `G-XXXXXXXXXX` do Google Analytics em `docs/DEPLOY.md`.
- **Mocks/dados simulados em código de produção**: nenhum. `LastKnownPriceScraperProvider` (o scraper padrão do pipeline de preço) é um limitador conhecido e já documentado em `docs/DEPLOY.md` e `OPERACAO_BETA.md` — ele confirma o último preço conhecido em vez de buscar preço novo em lojas externas; não é um mock oculto, é uma limitação registrada.
- **Dependências não utilizadas**: `depcheck` reportou 5 "não usadas" (`tailwindcss`, `@tailwindcss/postcss`, `prettier-plugin-tailwindcss`, `eslint-config-next`, `@types/eslint`) — todos falsos positivos confirmados manualmente: são consumidos via `postcss.config.mjs`, `.prettierrc.json` e a config do ESLint, que `depcheck` não interpreta. Também reportou 3 "dependências faltando" (`@core/index`, `@application/index`, `@infrastructure/index`) — são aliases de path do `tsconfig.json` para os pacotes do próprio monorepo, não pacotes npm reais. Nenhuma ação necessária.
- **Código morto / exports não utilizados**: `ts-prune` foi executado; o resultado é dominado por ruído esperado — arquivos de convenção do Next.js (`layout.tsx`, `manifest.ts`, `robots.ts`, `icon.tsx`, etc., que o framework importa por convenção de nome de arquivo, não via `import`) e o barrel público de tipos/critérios de `packages/application/src/domain-kernel.ts` (uma API pública intencional do Core Domain). Não foi identificado nenhum arquivo genuinamente órfão nesta varredura. Uma arqueologia mais profunda de código morto fica como recomendação (§8), não como bloqueio desta sprint.

## 5. Auditoria de qualidade

| Verificação                        | Resultado                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prisma validate`                  | ✅ Schema válido                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `prisma generate`                  | ✅ (após liberar um lock de arquivo do Windows deixado por um `next start` órfão de sprint anterior — não relacionado ao rebranding)                                                                                                                                                                                                                                                                                                        |
| `typecheck` (`tsc --noEmit`)       | ✅ Limpo                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `lint` (ESLint)                    | ✅ 0 erros — 4 warnings pré-existentes, não relacionados a esta sprint (`no-unused-vars` em `packages/application`)                                                                                                                                                                                                                                                                                                                         |
| `test` (Vitest, 179 testes)        | ✅ 179/179 — 2 retries por cold-start do Neon (comportamento conhecido e documentado deste ambiente, não regressão)                                                                                                                                                                                                                                                                                                                         |
| `build` (produção)                 | ✅ 48/48 páginas geradas, tamanhos de bundle idênticos aos da sprint anterior (First Load JS 185 kB compartilhado)                                                                                                                                                                                                                                                                                                                          |
| Bundle analysis                    | Sem aumento de peso: nenhuma dependência nova, mudança é só de texto/strings. Rotas e contagem de páginas estáticas/dinâmicas inalteradas                                                                                                                                                                                                                                                                                                   |
| Segurança (`npm audit`)            | 5 vulnerabilidades pré-existentes (1 moderate, 4 high) — ver §7, todas em ferramentas de build (`prisma` CLI via `deepmerge-ts`, `next`'s `postcss` interno), não em código executado em runtime pelo usuário final                                                                                                                                                                                                                         |
| Performance / Acessibilidade / SEO | Baseline Lighthouse mais recente disponível (`work/lighthouse-home.json`, capturado 2026-09-03, pouco antes do commit de rebranding): **Performance 68 · Acessibilidade 96 · Boas práticas 96 · SEO 100**. Uma nova execução do Lighthouse não foi possível nesta sessão (sem Chrome instalado no ambiente de auditoria); como a mudança desta sprint é só de texto/strings de marca, não há razão estrutural para essas notas terem mudado |

### Achado de auditoria (novo, fora do escopo de rebranding em si)

Durante a auditoria, uma tentativa de build/execução local com `NEXT_PUBLIC_SITE_URL=https://www.suplescore.com.br` revelou que páginas que fazem fetch da própria API via URL absoluta (`src/lib/api/fetchApi.ts`, usado por `/creatina` e `/creatina/[slug]`) falham com `ENOTFOUND` enquanto o domínio novo não resolver por DNS. Isto é **esperado e não é um bug desta sprint** — é a consequência direta e já prevista do item "deixar preparado caso o DNS ainda não esteja propagado": o código está pronto, mas só funciona de ponta a ponta quando `NEXT_PUBLIC_SITE_URL` aponta para um domínio que realmente resolve. Registrado aqui para que a variável de ambiente real na Vercel só seja trocada para `suplescore.com.br` depois que o DNS estiver confirmado — trocar antes disso colocaria `/creatina` e `/creatina/[slug]` fora do ar em produção.

## 6. Pendências externas (fora do alcance do código)

- **DNS**: `suplescore.com.br` precisa ser comprado/apontado antes de trocar a env var real de produção (ver achado acima).
- **Vercel**: a env var `NEXT_PUBLIC_SITE_URL` de produção (gerenciada no painel, fora do repositório) ainda aponta para `https://suplecheck.vercel.app` — só deve ser trocada depois do DNS confirmado, para não derrubar `/creatina`.
- **Projeto Vercel**: o projeto em si tem slug interno `suplecheck` (visível em `.env.production.local`, um snapshot local não commitado) — renomear o projeto na Vercel é uma ação de infraestrutura fora do alcance deste código, a decidir com o operador da conta.
- **Redes sociais e Search Console**: perfis externos (Instagram/LinkedIn/YouTube apontados em `src/config/nav.ts`) e a propriedade no Google Search Console/Bing Webmaster ainda precisam ser criados/migrados para o novo nome — nenhum destes existe como código, são ações manuais externas.
- **`.env.production.local`**: arquivo local (gitignored) tem várias variáveis sensíveis salvas como placeholder literal `"[SENSITIVE]"` (padrão do Vercel CLI para env vars marcadas como sensíveis, sem permissão de decriptação no pull) — não afeta o deploy real na Vercel, mas quebra um `next build`/`next start` local se você não sobrescrever `DATABASE_URL`/`DIRECT_URL` manualmente. Recomenda-se rodar `vercel env pull` de novo com as permissões corretas quando conveniente.

## 7. Pendências internas / dívida técnica

- **Scraper de preço**: `LastKnownPriceScraperProvider` não busca preço novo em lojas externas — limitação já conhecida e documentada, não uma dívida nova desta sprint.
- **Dependências com vulnerabilidade conhecida** (`npm audit`): `deepmerge-ts` (via `prisma` CLI) e `postcss` (empacotado dentro do `next`) — ambas em ferramentas de build/CLI, não em código servido a usuários finais. As correções sugeridas pelo `npm audit fix --force` implicam downgrade do Prisma e upgrade major do Next.js — decisão de upgrade que merece sprint própria, não uma correção às pressas aqui.
- **Configuração do Prisma**: aviso recorrente em todo comando (`package.json#prisma` está deprecated, migrar para `prisma.config.ts`) — cosmético, sem efeito funcional ainda, mas será obrigatório em uma versão futura do Prisma 7.
- **`vitest.config.ts`**: aviso do Vite sobre `configLoader: 'native'` (sintaxe ESM carregada como CommonJS) — também cosmético, sem efeito funcional hoje.

## 8. Próximas recomendações

1. Confirmar DNS de `suplescore.com.br` e só então atualizar a env var de produção na Vercel (ver §5/§6) — trate isso como um passo único e explícito, não automático.
2. Migrar/criar os perfis externos (redes sociais, Search Console, Bing Webmaster) para o nome novo.
3. Rodar `vercel env pull` novamente quando houver permissão de decriptação de variáveis sensíveis, para restaurar um `.env.production.local` funcional para builds locais.
4. Avaliar, como sprint própria e não urgente, a atualização do Prisma/Next.js para eliminar as 5 vulnerabilidades reportadas pelo `npm audit` — ambas exigem bump de versão major/breaking, avaliar changelog de cada uma antes.
5. Migrar `package.json#prisma` para `prisma.config.ts` antes do Prisma 7 tornar isso obrigatório.
6. Rodar uma auditoria Lighthouse fresca assim que houver Chrome disponível no ambiente (ou via CI), para confirmar formalmente que as notas de Performance/Acessibilidade/SEO/Boas práticas se mantêm após o rebranding.

## 9. Veredito

Todas as verificações do escopo desta sprint (ocorrências de marca, dívida técnica, qualidade/validações) vieram limpas, com exceção apenas dos 3 itens deliberadamente preservados (§3) e das pendências externas que não são código (§6). **A Sprint de Rebranding da SupleScore está oficialmente encerrada.**
