# SupleScore — Domain Data Model

> Modelo conceitual do negócio, não do banco de dados. Nenhuma tabela,
> nenhum tipo de coluna, nenhuma decisão do Prisma aparece aqui — isso é
> tradução, e vem depois. Este documento descreve o mundo real que o
> SupleScore representa: suplementos, lojas, preços, avaliações, pessoas.
> Ver [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) para a arquitetura
> de código (Domain/Application/Infrastructure) que _implementa_ este
> modelo — este documento é o que vem **antes** dela conceitualmente,
> ainda que tenha sido escrito depois.

## 0. Como ler este documento

- **Bounded Context**: uma fronteira de linguagem — dentro dela, um
  termo como "avaliação" significa uma coisa só. Contextos diferentes
  podem usar o mesmo nome para coisas diferentes; isso é esperado e
  saudável em DDD, não um erro a corrigir.
- **Aggregate / Aggregate Root**: um grupo de objetos que muda junto,
  sempre através de uma única porta de entrada (a raiz). Nada de fora do
  agregado guarda uma referência direta a uma peça interna dele — só ao
  root, por id.
- **Entidade**: tem identidade própria e lifecycle (`id` estável, muda
  de estado ao longo do tempo).
- **Value Object (VO)**: não tem identidade — é definido inteiramente
  pelo seu valor (dois VOs com os mesmos atributos são o mesmo VO). Se
  troca um atributo, é um VO diferente, não o mesmo objeto "atualizado".
- **Objeto de Referência**: uma entidade que outros agregados apontam
  por id, mas cujo ciclo de vida é gerenciado por um agregado diferente
  do que está referenciando (ex: `Loja` é referência para `Pricing`, mas
  pertence ao contexto `Store Directory`... — na prática, aqui, tratado
  como uma pequena entidade de referência dentro do próprio contexto que
  mais a usa, para não fragmentar demais).

## 1. Mapa de Bounded Contexts

```
┌─────────────────────────────────────────────────────────────────────┐
│                              CATALOG                                 │
│   Suplemento (=Produto) ── SKU ── Imagem                              │
│   Categoria · Marca · Fabricante                                     │
└───────────────┬───────────────────────────────────┬───────────────────┘
                 │ id                                 │ id
                 ▼                                     ▼
┌─────────────────────────────┐       ┌─────────────────────────────────┐
│           PRICING             │       │           EVALUATION              │
│  Loja                          │       │  Critério                          │
│  HistóricoDePreço (por SKU+Loja)│       │  Metodologia + VersãoDaMetodologia │
│  Preço (Value Object)           │       │  Avaliação + Índice (VO)            │
└───────────────┬─────────────────┘       └───────────────┬───────────────────┘
                 │                                          │
                 └──────────────────┬───────────────────────┘
                                     ▼
                        ┌─────────────────────────┐
                        │         RANKING           │
                        │  Ranking + RankingEntry(VO) │
                        └─────────────────────────┘

┌─────────────────────┐   ┌─────────────────────┐   ┌───────────────────────┐
│       CONTENT          │   │        GROWTH          │   │        IDENTITY          │
│  Artigo                 │   │  AssinanteNewsletter    │   │  Usuário                  │
└─────────────────────┘   └─────────────────────┘   │  Administrador             │
                                                       └───────────┬───────────────┘
                                                                     │ id
                        ┌─────────────────────────┐                 │
                        │     PERSONALIZATION        │◄──────────────┘
                        │  Favorito                    │
                        │  Alerta                       │
                        └─────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                          PLATFORM OPERATIONS                             │
│   Importação · Auditoria · Log (nível de infraestrutura, ver §3.9)        │
└───────────────────────────────────────────────────────────────────────┘
```

| Contexto                | Dono conceitual                                   | Aggregate Roots                                  |
| ----------------------- | ------------------------------------------------- | ------------------------------------------------ |
| **Catalog**             | Curadoria de conteúdo                             | `Suplemento`, `Categoria`, `Marca`, `Fabricante` |
| **Pricing**             | Monitoramento de preços                           | `Loja`, `HistoricoDePreco`                       |
| **Evaluation**          | Metodologia / ciência de dados                    | `Criterio`, `Metodologia`, `Avaliacao`           |
| **Ranking**             | Mesma equipe de Evaluation, papel de apresentação | `Ranking`                                        |
| **Content**             | Editorial                                         | `Artigo`                                         |
| **Growth**              | Marketing/aquisição                               | `AssinanteNewsletter`                            |
| **Identity**            | Plataforma core                                   | `Usuario`, `Administrador`                       |
| **Personalization**     | Produto                                           | `Favorito`, `Alerta`                             |
| **Platform Operations** | Engenharia/operações                              | `Importacao`, `Auditoria`                        |

Entre contextos, toda referência é **por id**, nunca por objeto
embutido — é isso que permite `Pricing` evoluir (trocar de fonte de
preço, mudar frequência de captura) sem `Catalog` sentir nada, e
vice-versa.

## 2. Decisões de nomenclatura (antes de detalhar cada entidade)

A lista de 26 conceitos pedida tem sobreposições reais do domínio, não
26 entidades independentes. Resolver isso explicitamente é parte do
trabalho de modelagem — inventar 26 entidades sem questionar
duplicaria responsabilidade e confundiria quem ler o modelo depois.

1. **"Suplemento" e "Produto" são o mesmo agregado.** Na linguagem do
   negócio (marketing, UI, este próprio parágrafo) as duas palavras são
   usadas de forma intercambiável para "o item comercial que o
   SupleScore avalia e compara" — não há nenhuma responsabilidade,
   atributo ou regra que diferencie um do outro. O nome canônico do
   agregado é `Suplemento`; `Produto` é sinônimo de uso corrente, nunca
   uma entidade separada.
2. **"Preço" é um Value Object, "Histórico de Preço" é a entidade.** Não
   existe "o preço atual" como uma linha separada e mutável — existe uma
   sequência imutável de capturas ao longo do tempo
   (`HistoricoDePreco`), e "o preço atual" é sempre a leitura mais
   recente dessa sequência. `Preço` (valor monetário + moeda) é o tipo
   usado dentro de `HistoricoDePreco` e em qualquer outro lugar que
   precise expressar dinheiro — nunca persistido sozinho.
3. **"Índice" é um Value Object dentro de "Avaliação".** `Avaliação` é o
   evento de negócio ("avaliamos o Suplemento X, usando a Metodologia Y
   versão Z, nesta data"); `Índice` é o resultado desse evento (a nota
   0–100 + classificação + detalhamento por critério). Um não existe
   sem o outro — por isso são o mesmo agregado, não dois.
4. **"Log" não é uma entidade de domínio.** Log técnico (linha de
   `console`, rastro de execução) não tem invariante de negócio, não
   muda de estado, não é algo que um humano do time de produto decide
   sobre — é responsabilidade de Infrastructure (`Logger`, já
   implementado em `packages/infrastructure`), não do Domain. O que
   _é_ domínio, e fica no lugar do que "log" normalmente sugere em um
   contexto de negócio, é `Auditoria` (§3.9) — a trilha de quem fez o
   quê, essa sim com significado de negócio.
5. **"Newsletter" é modelada como `AssinanteNewsletter`**, o inscrito —
   não existe ainda o conceito de "uma edição enviada" como entidade
   (isso é uma extensão natural futura, registrada em §6).

## 3. Contextos e entidades

### 3.1 Catalog

#### `Suplemento` (Aggregate Root)

**Responsabilidade**: representar um item comercial distinto que o
SupleScore cataloga e avalia — a unidade central de toda a plataforma.

**Atributos**: nome, slug, descrição, categoria (ref), marca (ref),
fabricante (ref, opcional), atributos específicos da categoria
(estrutura livre — ex: sabor, forma farmacêutica), status de
publicação, data de cadastro, data da última atualização.

**Estados / Lifecycle**:

```
RASCUNHO → EM_REVISAO → PUBLICADO ⇄ DESPUBLICADO
                              │
                              ▼
                          ARQUIVADO (terminal — produto descontinuado)
```

- `RASCUNHO`: criado por curadoria/importação, não visível publicamente.
- `EM_REVISAO`: dados completos, aguardando aprovação de um `Administrador`.
- `PUBLICADO`: visível, elegível para `Avaliação` e `Ranking`.
- `DESPUBLICADO`: temporariamente oculto (ex: erro de dado encontrado), reversível.
- `ARQUIVADO`: descontinuado pelo fabricante ou definitivamente removido do catálogo — nunca reaparece em `Ranking`, mas seu histórico de `Avaliação` continua consultável (nunca se apaga evidência histórica).

**Regras / Invariantes**:

- Um `Suplemento` sempre pertence a exatamente uma `Categoria` (a
  categoria é o que determina qual `Metodologia` se aplica a ele).
- `slug` é único na plataforma inteira, não só na categoria.
- Só pode transicionar para `PUBLICADO` se tiver ao menos um `SKU` ativo.
- `ARQUIVADO` é terminal — não existe caminho de volta.

**Relacionamentos / Cardinalidade**:

- `Categoria` — N:1 (obrigatório)
- `Marca` — N:1 (obrigatório)
- `Fabricante` — N:1 (opcional — nem toda marca revela o fabricante)
- `SKU` — 1:N (agregado — SKUs não existem fora de um Suplemento)
- `Imagem` — 1:N (agregado)
- `Avaliação` — 1:N (referência externa, contexto Evaluation)
- `Favorito`/`Alerta` — referenciado por id a partir de Personalization

**Eventos de domínio**: `SuplementoCadastrado`, `SuplementoPublicado`,
`SuplementoDespublicado`, `SuplementoArquivado`,
`AtributosDoSuplementoAlterados`.

---

#### `SKU` (Entity, membro do agregado `Suplemento`)

**Responsabilidade**: representar uma variação especifica e
comercializável de um `Suplemento` — tamanho de embalagem, sabor,
quantidade de porções. É o nível em que o preço realmente existe (dois
SKUs do mesmo Suplemento podem ter preços completamente diferentes).

**Atributos**: código (GTIN/EAN quando disponível), descrição da
variação (ex: "300g — sabor limão"), quantidade de porções, dosagem por
porção, status (ativo/descontinuado).

**Estados**: `ATIVO ⇄ DESCONTINUADO` (reversível — um SKU pode voltar a
ser vendido).

**Regras / Invariantes**:

- Um `SKU` sempre pertence a exatamente um `Suplemento` — nunca é
  movido de um Suplemento para outro (se isso "acontecer" no mundo
  real, o correto é descontinuar o SKU antigo e criar um novo).
- Código (GTIN/EAN), quando presente, é único na plataforma.

**Relacionamentos**: `Suplemento` — N:1 (dono); `HistoricoDePreco` —
1:N (referência externa, contexto Pricing).

**Eventos de domínio**: `SkuAdicionado`, `SkuDescontinuado`.

---

#### `Imagem` (Entity, membro do agregado `Suplemento`)

**Responsabilidade**: uma foto/arte do Suplemento, com posição definida
na galeria (a primeira é a capa).

**Atributos**: URL/chave de armazenamento (ver `StorageProvider`,
Infrastructure), texto alternativo, ordem de exibição, papel
(capa/galeria/selo-de-certificação).

**Regras**: exatamente uma imagem por Suplemento tem papel "capa" quando há ao menos uma imagem.

**Eventos de domínio**: `ImagemAdicionada`, `ImagemRemovida`, `OrdemDeImagensAlterada`.

---

#### `Categoria` (Aggregate Root, Objeto de Referência para os demais contextos)

**Responsabilidade**: agrupar suplementos que competem entre si e que,
por isso, compartilham a mesma `Metodologia` de avaliação (ver
`packages/core` — o Domain de cálculo já trata categoria como
`categorySlug` livre, exatamente para não travar aqui).

**Atributos**: nome, slug, descrição, categoria-pai (opcional —
hierarquia), status (ativa/oculta).

**Regras / Invariantes**:

- Uma `Categoria` só pode ser removida (nunca fisicamente — só ocultada) se não houver `Suplemento` ativo apontando para ela.
- Hierarquia (`categoria-pai`) tem no máximo 2 níveis por decisão de produto (categoria → subcategoria) — mais que isso normalmente indica que deveria ser um atributo de filtro, não uma categoria nova.

**Relacionamentos**: auto-relacionamento (pai/filhos); `Suplemento` — 1:N; `Metodologia` — 1:N ativas ao longo do tempo (histórico de qual metodologia vigorou quando).

**Eventos de domínio**: `CategoriaCriada`, `CategoriaOcultada`, `CategoriaVinculadaAMetodologia`.

---

#### `Marca` (Aggregate Root, Objeto de Referência)

**Responsabilidade**: a marca comercial sob a qual o produto é vendido — o que aparece na embalagem para o consumidor.

**Atributos**: nome, slug, logo (imagem), site oficial, país de origem.

**Relacionamentos**: `Suplemento` — 1:N.

**Eventos de domínio**: `MarcaCadastrada`.

---

#### `Fabricante` (Aggregate Root, Objeto de Referência)

**Responsabilidade**: quem efetivamente produz o item — frequentemente diferente da Marca (várias marcas terceirizam produção para poucos grandes fabricantes; saber disso é informação de valor para o consumidor, ex: "estas 5 marcas são feitas na mesma fábrica").

**Atributos**: nome, país, certificações conhecidas (ex: boas práticas de fabricação), site.

**Regras**: opcional em `Suplemento` — nem sempre essa informação é publicamente conhecida ou verificável; nunca inferir/adivinhar um Fabricante sem fonte.

**Relacionamentos**: `Suplemento` — 1:N.

**Eventos de domínio**: `FabricanteCadastrado`, `FabricanteVinculadoASuplemento`.

---

### 3.2 Pricing

#### `Loja` (Aggregate Root)

**Responsabilidade**: um ponto de venda externo onde um SKU pode ser comprado — a origem de um `HistoricoDePreco`.

**Atributos**: nome, slug, URL base, é_afiliado (bool), confiabilidade
(nota interna, alimenta o critério `store-reliability` do Domain de
cálculo), status.

**Estados**: `ATIVA ⇄ INATIVA` (uma loja pode ser pausada por deixar de responder/ser confiável, sem perder o histórico já coletado).

**Relacionamentos**: `HistoricoDePreco` — 1:N.

**Eventos de domínio**: `LojaCadastrada`, `LojaDesativada`.

---

#### `HistoricoDePreco` (Aggregate Root — leia-se "Histórico de Preço")

**Responsabilidade**: registro imutável de "este SKU custava X nesta
Loja neste momento". A série completa é o que permite responder "esse
produto está mais barato ou mais caro que há um mês?" — funcionalidade
central de qualquer comparador sério.

**Atributos**: SKU (ref), Loja (ref), `Preço` (Value Object: valor +
moeda), URL do anúncio no momento da captura, disponibilidade
(em estoque/esgotado), momento da captura.

**Regras / Invariantes**:

- **Nunca é editado nem apagado** — é 100% append-only. Um preço
  errado capturado por engano gera uma nova entrada de correção, não
  uma edição da anterior (mesmo espírito de `Auditoria`, §3.9, e da
  decisão já tomada para `ProductScore` no Domain de cálculo).
- Sempre referencia exatamente um `SKU` e uma `Loja`.

**Relacionamentos**: `SKU` — N:1; `Loja` — N:1.

**Eventos de domínio**: `PrecoCapturado`, `SkuFicouIndisponivel`, `SkuVoltouAoEstoque`.

**Nota de leitura**: "o preço atual" de um SKU numa Loja é sempre a
entrada mais recente desta série — nunca um campo separado e mutável
em `SKU`.

---

### 3.3 Evaluation

> Esta seção modela como **dado de negócio** o que
> `packages/core/ARCHITECTURE.md` já modela como **motor de cálculo**.
> As entidades abaixo são o que fica persistido; a lógica de como
> `Índice` é calculado a partir de `Critério`+`Metodologia` já está
> implementada e documentada lá — não é repetida aqui.

#### `Criterio` (Aggregate Root — "Critério")

**Responsabilidade**: representar, como dado consultável (nome,
descrição, status), um dos critérios de avaliação que o motor de
cálculo (`packages/core`) sabe executar. Não contém a lógica de cálculo
em si — essa é código (`Criterion.evaluate()`, Domain); esta entidade é
o "cartão de identidade" desse código, para exibição, ativação/
desativação, e composição de `Metodologia`.

**Atributos**: id técnico (kebab-case — ex: `cost-benefit`), nome de
exibição, descrição, tipo (`SIMPLES`/`COMPOSTO`), categorias aplicáveis
(vazio = todas), status.

**Estados**: `ATIVO ⇄ DESATIVADO → DEPRECIADO` (depreciado é
semi-terminal — só usado por versões antigas de `Metodologia` já
publicadas, nunca disponível para novas).

**Relacionamentos**: `Metodologia` — N:N via `VersaoDaMetodologia` (um critério participa de várias metodologias, com pesos diferentes em cada uma).

**Eventos de domínio**: `CriterioRegistrado`, `CriterioAtivado`, `CriterioDesativado`, `CriterioDepreciado`.

---

#### `Metodologia` (Aggregate Root) e `VersaoDaMetodologia` (Entity, membro do agregado)

**Responsabilidade**: `Metodologia` é a identidade estável ("a
metodologia de avaliação de creatinas"); `VersaoDaMetodologia` é uma
fotografia imutável dela em um ponto do tempo (quais critérios, com
quais pesos, qual sistema de classificação) — exatamente o par
`Methodology`/`MethodologyVersion` já implementado no Domain de
cálculo.

**Atributos de `Metodologia`**: id, nome, categoria(s) a que se aplica.

**Atributos de `VersaoDaMetodologia`**: número de versão (semver),
lista de (Critério, peso, habilitado), estratégia de agregação,
sistema de classificação, data de publicação, autor (Administrador).

**Estados de `VersaoDaMetodologia`**: `RASCUNHO → PUBLICADA` (terminal
e imutável — uma vez publicada, nunca mais muda; uma correção sempre
gera uma versão nova).

**Regras / Invariantes**:

- A soma dos pesos dos critérios habilitados de uma versão publicada é
  sempre 1 (100%) — invariante já garantida pelo Domain
  (`Methodology.of`), repetida aqui como regra de negócio, não só de
  código.
- Uma `Categoria` tem, a qualquer momento, no máximo uma
  `VersaoDaMetodologia` **vigente** — mas o histórico de versões
  anteriores nunca é apagado (necessário para reconstruir por que um
  `Índice` antigo tinha o valor que tinha).

**Relacionamentos**: `Metodologia` 1:N `VersaoDaMetodologia`; `VersaoDaMetodologia` N:N `Criterio`.

**Eventos de domínio**: `MetodologiaCriada`, `VersaoDaMetodologiaPublicada`, `VersaoDaMetodologiaTornouSeVigente` (para uma categoria).

---

#### `Avaliacao` (Aggregate Root — "Avaliação") e `Indice` (Value Object — "Índice")

**Responsabilidade**: `Avaliacao` é o evento de negócio "calculamos o
Índice deste Suplemento, nesta data, com esta metodologia, a partir
destes fatos" — o equivalente, como dado persistido, a
`SupleCheckIndexResult` (Domain). `Indice` é o resultado embutido
(nota + classificação + detalhamento por critério).

**Atributos de `Avaliacao`**: Suplemento (ref), VersaoDaMetodologia
(ref), fatos usados no cálculo (composição, preço, rótulo, reputação,
loja — o mesmo formato de `EvaluationContext`, Domain), `Indice`
(embutido), data do cálculo, origem (curadoria manual / importação
automática / recálculo agendado).

**Atributos de `Indice` (VO)**: nota final (0–100), faixa de
classificação, detalhamento por critério (nota + peso + observações
técnicas + alertas de validação).

**Estados**: nenhum — `Avaliacao` é imutável desde a criação (mesmo
espírito de `HistoricoDePreco`: uma reavaliação gera uma `Avaliacao`
nova, nunca edita a anterior).

**Regras / Invariantes**:

- Sempre referencia uma `VersaoDaMetodologia` **publicada** — nunca uma
  em rascunho.
- É a única forma legítima de produzir um `Indice` — nenhum outro
  lugar da plataforma inventa uma nota.

**Relacionamentos**: `Suplemento` — N:1; `VersaoDaMetodologia` — N:1.

**Eventos de domínio**: `SuplementoAvaliado` (carrega o `Indice`
resultante — é o evento mais "importante" da plataforma: dispara
possível notificação de `Alerta` por mudança de nota, entra no cálculo
do próximo `Ranking`, e é o que justifica a existência do produto).

---

### 3.4 Ranking

#### `Ranking` (Aggregate Root) e `RankingEntry` (Value Object)

**Responsabilidade**: um retrato ordenado de "estes são os melhores
suplementos desta categoria, segundo a última `Avaliacao` de cada um" —
gerado sob demanda (nunca calculado "ao vivo" a cada visita, por custo).

**Atributos de `Ranking`**: Categoria (ref), VersaoDaMetodologia (ref),
lista ordenada de `RankingEntry`, momento de geração.

**Atributos de `RankingEntry` (VO)**: posição, Suplemento (ref), nota
final **capturada no momento da geração** (não uma referência viva à
`Avaliacao` — um `Ranking` antigo deve continuar mostrando os números
de quando foi gerado, mesmo que o Suplemento tenha sido reavaliado
depois).

**Regras / Invariantes**:

- Só existe um `Ranking` **vigente** por Categoria de cada vez (o mais
  recente) — mas gerações anteriores podem ser preservadas para
  histórico/auditoria de mudança de posição ao longo do tempo (decisão
  de retenção é de produto/operação, não do modelo em si).
- Um `Suplemento` só entra em um `Ranking` se `PUBLICADO` e com ao
  menos uma `Avaliacao`.

**Relacionamentos**: `Categoria` — N:1; `VersaoDaMetodologia` — N:1; `Suplemento` — N:N via `RankingEntry`.

**Eventos de domínio**: `RankingGerado`.

---

### 3.5 Content

#### `Artigo` (Aggregate Root)

**Responsabilidade**: conteúdo editorial (guias, explicações,
comparativos em texto) — existe para SEO e para dar contexto ao redor
dos números do `Índice`.

**Atributos**: título, slug, resumo, corpo, imagem de capa, autor
(Administrador), categoria(s) relacionada(s) (opcional), data de
publicação.

**Estados**: `RASCUNHO → PUBLICADO ⇄ DESPUBLICADO`.

**Relacionamentos**: `Suplemento`/`Categoria` — N:N opcional (um artigo pode mencionar/relacionar produtos, sem que isso seja obrigatório).

**Eventos de domínio**: `ArtigoPublicado`, `ArtigoDespublicado`.

---

### 3.6 Growth

#### `AssinanteNewsletter` (Aggregate Root)

**Responsabilidade**: alguém que forneceu o e-mail para receber
novidades — a base da lista de e-mail marketing (equivalente ao `Lead`
já modelado na Fase 0 do app; aqui elevado a cidadão de primeira classe
do modelo conceitual, com estado explícito).

**Atributos**: e-mail, origem da captura (home, artigo, modal de
saída...), data de inscrição, data de cancelamento (se houver).

**Estados**:

```
INSCRITO ⇄ CANCELADO
    │
    ▼
REJEITADO (bounce definitivo — e-mail inválido, nunca mais tenta enviar)
```

**Regras / Invariantes**: e-mail único; cancelamento é sempre reversível por ação do próprio assinante (opt-out não é banimento), `REJEITADO` não é.

**Relacionamentos**: nenhum obrigatório com `Usuario` — uma pessoa pode se inscrever sem ter conta, e ter conta sem se inscrever. Correlação por e-mail é possível, mas não uma referência estrutural (ver §6, extensão futura).

**Eventos de domínio**: `AssinanteInscrito`, `AssinanteCancelou`, `EmailRejeitado`.

---

### 3.7 Identity

#### `Usuario` (Aggregate Root — "Usuário")

**Responsabilidade**: uma pessoa consumidora com conta na plataforma —
habilita `Favorito`, `Alerta`, e o plano premium.

**Atributos**: nome, e-mail, plano (`GRATUITO`/`PREMIUM`), data de
criação, data de verificação do e-mail.

**Estados**: `NAO_VERIFICADO → ATIVO ⇄ SUSPENSO`.

**Regras / Invariantes**: e-mail único; `SUSPENSO` bloqueia login mas preserva `Favorito`/`Alerta` (não é uma exclusão).

**Relacionamentos**: `Favorito` — 1:N; `Alerta` — 1:N.

**Eventos de domínio**: `UsuarioCadastrado`, `EmailVerificado`,
`UsuarioMudouDePlano`, `UsuarioSuspenso`.

---

#### `Administrador` (Aggregate Root, distinto de `Usuario`)

**Responsabilidade**: identidade interna de quem opera a plataforma
(curadoria de catálogo, publicação de metodologia, moderação de
conteúdo) — modelada separada de `Usuario` deliberadamente: são
audiências, permissões e requisitos de segurança completamente
diferentes (um consumidor nunca deveria, nem acidentalmente, herdar
permissão administrativa por compartilhar a mesma tabela/agregado).

**Atributos**: nome, e-mail, papel (`CURADOR`/`EDITOR`/`SUPER_ADMIN`), status.

**Estados**: `ATIVO ⇄ DESATIVADO`.

**Relacionamentos**: origem de ação em `Auditoria` (referência por id); autor de `VersaoDaMetodologia` e `Artigo`.

**Eventos de domínio**: `AdministradorCadastrado`, `AdministradorDesativado`, `PapelDeAdministradorAlterado`.

---

### 3.8 Personalization

#### `Favorito` (Aggregate Root, leve)

**Responsabilidade**: marca "este Usuário tem interesse neste
Suplemento" — a base de uma futura tela "meus favoritos" e de
priorização de notificação.

**Atributos**: Usuario (ref), Suplemento (ref), data de criação.

**Regras / Invariantes**: par (Usuario, Suplemento) é único — favoritar de novo é idempotente, não duplica.

**Eventos de domínio**: `SuplementoFavoritado`, `SuplementoDesfavoritado`.

---

#### `Alerta` (Aggregate Root — "Alertas")

**Responsabilidade**: uma inscrição para ser notificado quando uma
condição específica sobre um `Suplemento` acontecer.

**Atributos**: Usuario (ref), Suplemento (ref), condição
(`QUEDA_DE_PRECO`/`VOLTA_AO_ESTOQUE`/`MUDANCA_DE_INDICE`), valor-alvo
(ex: "abaixo de R$ 90"), status.

**Estados**: `ATIVO ⇄ PAUSADO → DISPARADO → EXPIRADO`
(`DISPARADO`=condição já satisfeita e o usuário já foi avisado;
`EXPIRADO`=alerta antigo sem interação, limpeza natural).

**Regras / Invariantes**: um alerta disparado não dispara de novo
para o mesmo evento (evita spam) — precisa de nova condição satisfeita
ou reativação manual.

**Relacionamentos**: reage a eventos de `HistoricoDePreco`
(`PrecoCapturado`) e `Avaliacao` (`SuplementoAvaliado`) de outros
contextos.

**Eventos de domínio**: `AlertaCriado`, `AlertaDisparado`, `AlertaPausado`, `AlertaExpirado`.

---

### 3.9 Platform Operations

#### `Importacao` (Aggregate Root — "Importações")

**Responsabilidade**: um lote de dados trazidos de uma fonte externa
(planilha de curadoria manual, feed de marketplace) — rastreia o que
foi tentado, o que teve sucesso, o que falhou.

**Atributos**: fonte (nome/tipo), Administrador responsável, momento de
início/fim, contagem de registros lidos/importados/com erro, lista de
erros.

**Estados**: `PENDENTE → PROCESSANDO → CONCLUIDA` (ou `CONCLUIDA_COM_ERROS` / `FALHOU`).

**Regras / Invariantes**: uma importação nunca edita `HistoricoDePreco`
existente — sempre adiciona (mesma regra de append-only); uma
importação que falha no meio não deixa `Suplemento`/`SKU` em estado
inconsistente (tudo ou nada por registro individual, não por lote
inteiro).

**Eventos de domínio**: `ImportacaoIniciada`, `ImportacaoConcluida`, `ImportacaoFalhou`.

---

#### `Auditoria` (Aggregate Root)

**Responsabilidade**: trilha imutável de "quem fez o quê, quando" —
toda ação administrativa relevante (publicar Suplemento, publicar
VersaoDaMetodologia, desativar Critério...) gera uma entrada. Já
implementada como Port (`AuditLogPort`) na Application Layer — esta é
a contraparte conceitual/de negócio.

**Atributos**: ator (Administrador ou "sistema"), ação, tipo e id da
entidade afetada, metadados, momento.

**Regras / Invariantes**: **write-only do ponto de vista do fluxo
normal da aplicação** — nunca editada nem apagada; só lida por quem
investiga.

**Eventos de domínio**: nenhum (é, ela mesma, o registro de outros
eventos — não dispara novos).

---

#### Nota sobre "Log"

Não modelado como aggregate — ver §2.4. O que existe é
`Logger`/`ConsoleLogger` (Infrastructure, já implementado), que registra
execução técnica sem significado de negócio. Se um dia "log de sistema"
precisar virar consulta de produto (ex: um painel de observabilidade
dentro do admin), a entidade correta a criar naquele momento é uma nova
— não forçar `Auditoria` a acumular dado técnico que não é dela.

## 4. Tabela de relacionamentos (visão consolidada)

| De                  | Para                            | Cardinalidade                  | Tipo de referência                  |
| ------------------- | ------------------------------- | ------------------------------ | ----------------------------------- |
| Suplemento          | Categoria                       | N:1                            | Id (cross-context)                  |
| Suplemento          | Marca                           | N:1                            | Id (cross-context)                  |
| Suplemento          | Fabricante                      | N:1 (opcional)                 | Id (cross-context)                  |
| Suplemento          | SKU                             | 1:N                            | Agregado (mesmo aggregate)          |
| Suplemento          | Imagem                          | 1:N                            | Agregado (mesmo aggregate)          |
| SKU                 | HistoricoDePreco                | 1:N                            | Id (cross-context)                  |
| Loja                | HistoricoDePreco                | 1:N                            | Id (mesmo contexto)                 |
| Categoria           | Categoria (pai)                 | N:1 opcional                   | Agregado (auto-relação)             |
| Categoria           | VersaoDaMetodologia             | 1:N (histórico), 1:1 (vigente) | Id (cross-context)                  |
| Metodologia         | VersaoDaMetodologia             | 1:N                            | Agregado (mesmo aggregate)          |
| VersaoDaMetodologia | Criterio                        | N:N (com peso)                 | Id (cross-context)                  |
| Avaliacao           | Suplemento                      | N:1                            | Id (cross-context)                  |
| Avaliacao           | VersaoDaMetodologia             | N:1                            | Id (cross-context)                  |
| Ranking             | Categoria                       | N:1                            | Id (cross-context)                  |
| Ranking             | VersaoDaMetodologia             | N:1                            | Id (cross-context)                  |
| Ranking             | Suplemento                      | N:N via RankingEntry           | Id (cross-context, valor capturado) |
| Artigo              | Suplemento/Categoria            | N:N opcional                   | Id (cross-context)                  |
| Favorito            | Usuario                         | N:1                            | Id (cross-context)                  |
| Favorito            | Suplemento                      | N:1                            | Id (cross-context)                  |
| Alerta              | Usuario                         | N:1                            | Id (cross-context)                  |
| Alerta              | Suplemento                      | N:1                            | Id (cross-context)                  |
| Auditoria           | Administrador/Usuario           | N:1 (polimórfico por ator)     | Id (cross-context)                  |
| Auditoria           | qualquer entidade               | N:1 (polimórfico por tipo+id)  | Id genérico                         |
| Importacao          | Administrador                   | N:1                            | Id (cross-context)                  |
| Importacao          | Suplemento/SKU/HistoricoDePreco | 1:N (produz)                   | Efeito, não referência armazenada   |

## 5. Catálogo consolidado de Eventos de Domínio

Reunidos aqui porque um catálogo de eventos é, na prática, o desenho de
toda a integração futura entre contextos (ex: `Alerta` reage a
`PrecoCapturado` e `SuplementoAvaliado` sem que `Pricing`/`Evaluation`
precisem conhecer `Personalization` — publica-se o evento, quem
interessar se inscreve).

| Contexto            | Eventos                                                                                                                                                                                                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog             | `SuplementoCadastrado`, `SuplementoPublicado`, `SuplementoDespublicado`, `SuplementoArquivado`, `AtributosDoSuplementoAlterados`, `SkuAdicionado`, `SkuDescontinuado`, `ImagemAdicionada`, `ImagemRemovida`, `CategoriaCriada`, `CategoriaOcultada`, `MarcaCadastrada`, `FabricanteCadastrado` |
| Pricing             | `LojaCadastrada`, `LojaDesativada`, `PrecoCapturado`, `SkuFicouIndisponivel`, `SkuVoltouAoEstoque`                                                                                                                                                                                             |
| Evaluation          | `CriterioRegistrado`, `CriterioAtivado`, `CriterioDesativado`, `CriterioDepreciado`, `MetodologiaCriada`, `VersaoDaMetodologiaPublicada`, `VersaoDaMetodologiaTornouSeVigente`, `SuplementoAvaliado`                                                                                           |
| Ranking             | `RankingGerado`                                                                                                                                                                                                                                                                                |
| Content             | `ArtigoPublicado`, `ArtigoDespublicado`                                                                                                                                                                                                                                                        |
| Growth              | `AssinanteInscrito`, `AssinanteCancelou`, `EmailRejeitado`                                                                                                                                                                                                                                     |
| Identity            | `UsuarioCadastrado`, `EmailVerificado`, `UsuarioMudouDePlano`, `UsuarioSuspenso`, `AdministradorCadastrado`, `AdministradorDesativado`                                                                                                                                                         |
| Personalization     | `SuplementoFavoritado`, `SuplementoDesfavoritado`, `AlertaCriado`, `AlertaDisparado`, `AlertaPausado`, `AlertaExpirado`                                                                                                                                                                        |
| Platform Operations | `ImportacaoIniciada`, `ImportacaoConcluida`, `ImportacaoFalhou`                                                                                                                                                                                                                                |

**Consumidores previstos entre contextos** (documentado, não
implementado — não existe barramento de eventos ainda):

- `Personalization` consome `PrecoCapturado` e `SuplementoAvaliado` para decidir se um `Alerta` dispara.
- `Ranking` consome `SuplementoAvaliado` como gatilho de "vale a pena gerar um novo Ranking desta categoria".
- `Growth`/notificação (futuro) consome `VersaoDaMetodologiaTornouSeVigente` e `RankingGerado` para newsletters automáticas.

## 6. Autoauditoria — o que pode ter ficado de fora

Verificação deliberada contra os 26 conceitos pedidos, um a um:

| Pedido                | Coberto por                           | Observação                         |
| --------------------- | ------------------------------------- | ---------------------------------- |
| Suplemento            | `Suplemento`                          | —                                  |
| Categoria             | `Categoria`                           | —                                  |
| Marca                 | `Marca`                               | —                                  |
| Fabricante            | `Fabricante`                          | —                                  |
| Loja                  | `Loja`                                | —                                  |
| Produto               | `Suplemento`                          | Fundido deliberadamente — ver §2.1 |
| SKU                   | `SKU`                                 | —                                  |
| Preço                 | `Preco` (Value Object)                | Não é entidade própria — ver §2.2  |
| Histórico de Preço    | `HistoricoDePreco`                    | —                                  |
| Imagem                | `Imagem`                              | —                                  |
| Avaliação             | `Avaliacao`                           | —                                  |
| Critério              | `Criterio`                            | —                                  |
| Metodologia           | `Metodologia`                         | —                                  |
| Versão da Metodologia | `VersaoDaMetodologia`                 | —                                  |
| Índice                | `Indice` (Value Object)               | Embutido em `Avaliacao` — ver §2.3 |
| Ranking               | `Ranking`                             | —                                  |
| Artigo                | `Artigo`                              | —                                  |
| Newsletter            | `AssinanteNewsletter`                 | —                                  |
| Usuário               | `Usuario`                             | —                                  |
| Favoritos             | `Favorito`                            | —                                  |
| Alertas               | `Alerta`                              | —                                  |
| Administrador         | `Administrador`                       | —                                  |
| Importações           | `Importacao`                          | —                                  |
| Logs                  | Infraestrutura (`Logger`), não Domain | Ver §2.4                           |
| Auditoria             | `Auditoria`                           | —                                  |

Todos os 26 conceitos endereçados — 24 como entidade/VO própria, 1
fundido por redundância real (Produto=Suplemento), 1 rebaixado
conscientemente para Infrastructure (Log).

### O que **não** foi pedido, mas ficou visivelmente ausente na revisão de 5 anos

Revisar o modelo pensando em "milhares de produtos, dezenas de
categorias, múltiplas metodologias, área premium, integrações
externas" (o pedido explícito de revisão futura) expôs 3 lacunas reais
— registradas aqui em vez de silenciosamente adicionadas ao modelo
principal sem terem sido pedidas:

1. **Cobrança/assinatura premium não tem entidade própria.**
   `Usuario.plano` (`GRATUITO`/`PREMIUM`) é suficiente para o Domain de
   cálculo saber "este usuário pode ver histórico de preço", mas não
   modela _como_ alguém vira premium — não há `Plano`, `Assinatura`
   nem `Pagamento`. Necessário antes de área premium virar realidade,
   não antes disso.
2. **Não há entidade para "review de usuário final" (nota/comentário
   dado por quem comprou), só `Avaliacao` (o cálculo objetivo do
   Índice).** Se o produto decidir um dia combinar "nota calculada" com
   "nota da comunidade", isso é um novo agregado (`AvaliacaoDeUsuario`
   ou similar), propositalmente não confundido com `Avaliacao` — o nome
   já quase colide, um motivo a mais para não introduzir sem necessidade
   real confirmada.
3. **Notificação (o canal — e-mail/push) não tem entidade.** `Alerta`
   modela _a inscrição_ na condição; o _envio de fato_ (quando disparou,
   por qual canal, se foi entregue) é uma responsabilidade separada,
   ainda sem modelo, natural extensão de `AlertaDisparado`.

Nenhuma das três foi adicionada ao modelo principal — fariam o
documento responder a um requisito que não foi feito ainda. Ficam
registradas para quando a etapa correspondente (Premium, Comunidade,
Notificações) for de fato iniciada.

## 7. Revisão para 5 anos — a plataforma em escala

- **Milhares de suplementos, dezenas de categorias.** `Categoria` já
  suporta hierarquia (2 níveis) e `Suplemento`/`SKU` não têm nenhum
  limite estrutural de volume — o gargalo em escala é de índice/consulta
  (Infrastructure), não de modelo. `HistoricoDePreco` é a entidade que
  mais cresce (uma linha por SKU×Loja×captura) — desenhada append-only
  desde o início exatamente para suportar isso sem re-modelagem.
- **Múltiplas metodologias.** Já é o caso hoje — cada `Categoria` tem
  sua própria `VersaoDaMetodologia` vigente, e o Domain de cálculo
  (`packages/core`) já suporta `CategoryOverride` para variações dentro
  da mesma metodologia base. O modelo de dados não precisa mudar para
  isso; já nasceu assim.
- **Área premium.** Gap identificado em §6.1 — o modelo está pronto
  para receber `Plano`/`Assinatura`/`Pagamento` como um novo Bounded
  Context (`Billing`) quando chegar a hora, sem exigir mudança em
  `Usuario` além de manter `plano` como está (ou substituí-lo por uma
  referência a `Assinatura` vigente).
- **Integrações externas** (marketplaces, GA/Clarity — já com Ports/
  stubs em `packages/infrastructure`). No modelo de dados, o ponto de
  entrada é sempre `Importacao` (para dado de catálogo/preço) — nenhuma
  integração externa escreve diretamente em `Suplemento`/`HistoricoDePreco`
  sem passar por um registro de importação seu, o que preserva
  rastreabilidade de origem em escala (essencial quando existirem
  dezenas de fontes externas simultâneas, não só curadoria manual).
- **O que vai doer primeiro em escala real**, honestamente: não é o
  modelo em si, é a ausência de uma estratégia de particionamento/
  arquivamento para `HistoricoDePreco` e `Avaliacao` (que crescem sem
  limite natural) — decisão de Infrastructure/banco quando o Prisma for
  conectado, não deste documento, mas vale deixar sinalizado aqui para
  quem desenhar o schema físico depois.
