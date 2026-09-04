# SupleScore — Data Pipeline Architecture

> Como a plataforma recebe, valida, normaliza, deduplica, enriquece,
> avalia, persiste e torna descobrível qualquer dado — de qualquer
> origem. Este documento projeta o _fluxo_, não o _armazenamento_:
> nenhuma tabela, nenhuma migration, nenhum Prisma aparece aqui. Ver
> [`../domain-model/DOMAIN_MODEL.md`](../domain-model/DOMAIN_MODEL.md)
> para as entidades que este pipeline produz/atualiza (`Suplemento`,
> `SKU`, `HistoricoDePreco`, `Avaliacao`...) e
> [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) para a arquitetura de
> código (Domain/Application/Infrastructure) onde cada estágio abaixo já
> tem — ou vai ganhar — uma peça concreta correspondente.

## 0. Princípio central

**Toda origem de dado, não importa quão diferente por fora (um
formulário de admin, um CSV, uma API de marketplace), converge para o
mesmo pipeline de 8 estágios.** Isso é o que evita que "importar da
Amazon" e "cadastro manual" sejam dois sistemas paralelos com regras
duplicadas e divergentes — a única diferença entre origens é _como o
Estágio 1 (Entrada) traduz aquela origem para o formato comum_; a
partir do Estágio 2 em diante, o pipeline não sabe nem se importa de
onde o dado veio.

## 1. Origens de dados (Estágio 1 — Entrada)

| Origem                                                                                 | Confiabilidade                                 | Frequência                        | Quem aciona                    | Peça de código já existente                                                                                                                                                        |
| -------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cadastro manual**                                                                    | Alta (curador verificou pessoalmente)          | Sob demanda                       | `Administrador` via formulário | `RegisterSupplementCommand`/`EvaluateSupplementCommand` (Application)                                                                                                              |
| **Painel administrativo (edição em massa)**                                            | Alta                                           | Sob demanda                       | `Administrador`                | `UpdateSupplementUseCase`, futuro `SetCriterionStatusUseCase`-like para lote                                                                                                       |
| **CSV**                                                                                | Média (depende de quem preencheu a planilha)   | Pontual/agendada                  | `Administrador` faz upload     | `ImportSourcePort`/`ImportRecord` (Application/Infrastructure) — hoje só `InMemoryImportSourceAdapter`; um `CsvImportSourceAdapter` é a implementação natural futura do mesmo Port |
| **APIs externas genéricas**                                                            | Variável — depende do provedor                 | Agendada/webhook                  | Sistema (scheduler)            | `HttpClient`/`ExternalOperationError` (Infrastructure)                                                                                                                             |
| **Marketplaces** (Amazon, Mercado Livre, Shopee, Magalu)                               | Média — dado de terceiro, nunca curado por nós | Agendada (ex: diária, para preço) | Sistema (scheduler)            | `MarketplacePriceProvider` + 4 stubs (Infrastructure) — hoje lançam `ProviderNotImplementedError`, o pipeline já está desenhado para o dia em que pararem de lançar                |
| **Importadores futuros** (feed de fabricante, parceria de dados, planilha de terceiro) | Desconhecida até ser avaliada                  | Variável                          | Variável                       | Mesmo `ImportSourcePort` — é exatamente por isso que o Port existe como interface genérica, não amarrada a "CSV" ou "Amazon"                                                       |

**Regra que unifica todas as origens**: toda origem, exceto cadastro
manual direto no formulário, produz um `Importacao` (`Domain Model`
§3.9) — mesmo uma chamada de API agendada gera um registro de
importação de 1 item. Isso é o que torna auditável "de onde veio esse
dado", inclusive para o próprio cadastro manual, que é tratado como uma
`Importacao` de tamanho 1 e origem `"admin-form"`, não como um caminho
especial fora do pipeline.

## 2. O pipeline — 8 estágios

```
 (1) ENTRADA
      │  origem-específico: CSV parseado, resposta de API, form submetido
      ▼
 (2) VALIDAÇÃO
      │  forma correta? campos obrigatórios? tipos certos?
      ▼
 (3) NORMALIZAÇÃO
      │  mesma unidade, mesma categoria, mesmo formato de texto
      ▼
 (4) DEDUPLICAÇÃO
      │  isso já existe na plataforma? é o mesmo Suplemento/SKU?
      ▼
 (5) ENRIQUECIMENTO
      │  preencher lacunas com fontes adicionais (opcional, nunca bloqueia)
      ▼
 (6) AVALIAÇÃO
      │  calcular o Índice, se houver fatos suficientes
      ▼
 (7) PERSISTÊNCIA
      │  gravar via Repository Ports — sempre a última etapa que pode falhar
      ▼
 (8) INDEXAÇÃO
      │  tornar descobrível: cache, busca, gatilho de novo Ranking
      ▼
    FIM (SuplementoDisponivelParaConsulta)
```

Cada estágio é uma função pura de "estado anterior → próximo estado ou
erro" — nenhum estágio decide por conta própria pular outro (ex:
Enriquecimento nunca pula Validação). Um registro que falha em um
estágio não avança; os estágios anteriores já persistidos (se algum já
persistiu) não são desfeitos automaticamente — ver §4.9 (Rollback).

---

### (1) Entrada

**Responsabilidade**: traduzir o formato específico da origem
(linha de CSV, JSON de API, corpo de formulário) para o formato comum de
entrada do pipeline — hoje, o mesmo formato que `RegisterSupplementCommand`/
`EvaluateSupplementCommand` (Application) já aceitam.

**Síncrono ou assíncrono**: **síncrono** para cadastro manual e edição
via painel (o usuário espera a resposta na hora); **candidato natural a
assíncrono** para CSV grande e importações agendadas de marketplace —
ver §5.

**Erros tratados aqui**: arquivo ilegível, JSON malformado, schema de
resposta de API inesperado. Nenhum erro de _conteúdo_ (isso é
Validação) — só de _forma bruta_.

**Evento de domínio**: `ImportacaoIniciada` (já catalogado no Domain
Model) — disparado assim que um lote é reconhecido, antes de qualquer
linha ser processada.

---

### (2) Validação

**Responsabilidade**: a mesma que `RegisterSupplementValidator`/
`EvaluateSupplementValidator` (Application, já implementados) já fazem
— checar que os campos obrigatórios existem e têm o tipo/formato certo,
**antes** de tentar montar qualquer objeto de Domain. Não valida
_regra de negócio_ (isso é Deduplicação/Persistência) — só _forma_.

**Síncrono ou assíncrono**: sempre síncrono em relação ao registro
individual que está sendo validado (não faz sentido validar "depois") —
mas processado em lote de forma assíncrona quando a origem for
assíncrona (ver §5): cada linha é validada de forma independente das
demais.

**Erros tratados aqui**: campo obrigatório ausente, tipo errado, faixa
de valor inválida (ex: preço negativo).

**Estratégia de falha**: **por registro, nunca por lote** — uma linha
de CSV com erro de validação não invalida as outras 999 linhas boas do
mesmo arquivo (ver §4.8, Importações Parciais).

**Evento de domínio**: `RegistroDeImportacaoRejeitado` (novo — específico deste pipeline, catalogado em §6).

---

### (3) Normalização

**Responsabilidade**: fazer com que dois registros que descrevem "a
mesma coisa do mundo real" cheguem ao próximo estágio com a mesma
forma — para que Deduplicação (Estágio 4) possa comparar de verdade.
Inclui: `slugify` de nome/marca (já existe em
`src/lib/utils/format.ts` no app web — a mesma função, ou seu
equivalente de Application, deve ser reaproveitada aqui, não
reescrita); conversão de unidade de dosagem para uma unidade canônica
por categoria; mapeamento de categoria/taxonomia externa (ex: a
categoria do feed da Amazon) para o slug de `Categoria` do SupleScore;
normalização de moeda para centavos (`Money`/`Preco`, já um Value
Object no Domain).

**Síncrono ou assíncrono**: síncrono por registro — é uma
transformação pura, sem I/O, então não há razão de custo para
assíncrono aqui (diferente de Enriquecimento, que faz chamada externa).

**Regra de mapeamento de categoria desconhecida**: um registro cuja
categoria de origem não mapeia para nenhuma `Categoria` conhecida
**não é descartado nem forçado numa categoria errada** — fica retido
em um estado `AGUARDANDO_MAPEAMENTO_DE_CATEGORIA`, visível para um
`Administrador` resolver manualmente (mapear a categoria nova ou
recategorizar). Nunca inventar uma categoria automaticamente.

**Evento de domínio**: nenhum evento próprio — normalização é
transparente para quem consome o pipeline; só aparece indiretamente no
formato final do dado.

---

### (4) Deduplicação

**Responsabilidade**: decidir se um registro normalizado é (a) um
`Suplemento`/`SKU` novo, (b) uma atualização de um existente, ou (c)
ambíguo o suficiente para exigir revisão humana. Esta é a etapa mais
delicada do pipeline — ver §4.1–§4.3 para as estratégias completas
(produto duplicado, mudança de embalagem, mudança de SKU).

**Síncrono ou assíncrono**: síncrono por registro em relação ao próprio
registro, mas **depende de leitura do estado atual da plataforma**
(precisa consultar `SupplementRepositoryPort`/`findBySlug` — já
existente), o que o torna candidato a gargalo em importações grandes —
é aqui, mais que em qualquer outro estágio, que um cache de chaves de
deduplicação (índice invertido por GTIN/slug) importa em escala (ver
§7).

**Evento de domínio**: `DuplicidadePotencialDetectada` (quando cai no
caso "ambíguo", nunca decide sozinho) — novo, catalogado em §6.

---

### (5) Enriquecimento

**Responsabilidade**: preencher lacunas do registro com fontes
adicionais — ex: um cadastro manual sem foto pode ser enriquecido com a
imagem pública do fabricante; um preço sem "preço médio de categoria"
(`PricingFacts.categoryAveragePricePerDoseInCents`, já um fato conhecido
do Domain de cálculo) pode ser enriquecido calculando a partir do
`HistoricoDePreco` de concorrentes na mesma categoria.

**Regra fundamental: Enriquecimento nunca é obrigatório e nunca
bloqueia o pipeline.** Se uma fonte de enriquecimento falhar ou não
tiver o dado, o registro segue adiante com o que já tinha — é
estritamente aditivo. Isso é o motivo de todos os `MarketplacePriceProvider`
existirem como `Provider` opcional em vez de dependência obrigatória
do pipeline.

**Síncrono ou assíncrono**: **o candidato mais forte a assíncrono de
todo o pipeline** — chamadas a APIs externas (marketplace, geocoding)
têm latência e taxa de falha variáveis; um registro não deveria ficar
"preso" esperando um enriquecimento opcional. Modelo hoje: síncrono,
best-effort, com timeout curto (mesmo padrão de `HttpRequestOptions.timeoutMs`,
já em `FetchHttpClient`). Modelo futuro: publicar
`SuplementoPersistido` e deixar um worker de enriquecimento assíncrono
(consumindo de `QueueProvider`, já implementado em Infrastructure)
atualizar o registro depois, gerando sua própria `Avaliacao` revisada
se o enriquecimento mudar algum fato relevante.

**Evento de domínio**: `RegistroEnriquecido` (novo, §6) — carrega quais
campos foram preenchidos e de qual fonte, para auditoria de proveniência.

---

### (6) Avaliação

**Responsabilidade**: literalmente `EvaluateSupplementUseCase`/
`CalculateIndexUseCase` (Application, já implementados) — nenhuma
lógica nova aqui, esta etapa do pipeline é uma chamada direta ao que já
existe. Um registro só chega aqui se tiver `Suplemento`/`SKU`
resolvido (Estágio 4) e fatos mínimos (Estágios 3+5).

**Regra**: se os fatos disponíveis forem insuficientes para calcular
com confiança (nenhum `EvaluationContext` minimamente preenchido), o
pipeline **persiste o Suplemento/SKU mesmo assim, sem `Avaliacao`** —
cadastro e avaliação são desacoplados por design (o Domain de cálculo já
suporta isso: um `Suplemento` pode existir e ser "não avaliado ainda").
Nunca inventa uma nota com dado insuficiente.

**Síncrono ou assíncrono**: síncrono hoje (o cálculo em si é rápido —
puro, em memória, sem I/O, ver `packages/core`). Continua fazendo
sentido síncrono mesmo em escala, porque o custo não cresce com o
tamanho da plataforma — cresce só com o número de critérios ativos.

**Evento de domínio**: `SuplementoAvaliado` (já catalogado no Domain Model).

---

### (7) Persistência

**Responsabilidade**: gravar via os Repository Ports já definidos
(`SupplementRepositoryPort`, `IndexResultRepositoryPort`, etc.) — a
única etapa que efetivamente muda o estado duradouro da plataforma.
Tudo antes disso é cálculo/decisão; isto é o commit.

**Regra de atomicidade por registro**: cada registro individual do lote
é persistido como uma unidade — se `Suplemento` grava mas `Avaliacao`
falha ao gravar, o registro inteiro é marcado como falho e reprocessável
(ver §4.7), nunca um `Suplemento` "órfão" sem explicação de por que não
tem avaliação. Hoje, sem transação real (`InMemoryTransactionManager`,
Infrastructure, é um passthrough sem rollback verdadeiro — documentado
como limitação honesta) — quando o Prisma for conectado, este é o ponto
exato onde `TransactionManager.runInTransaction` passa a importar de
verdade.

**Síncrono ou assíncrono**: síncrono — nunca faz sentido persistir "só
depois", sob risco de o pipeline reportar sucesso para um dado que
ainda não existe de fato.

**Evento de domínio**: `SuplementoPersistido`, `SkuPersistido`,
`PrecoCapturado`(já catalogado) — disparados após confirmação de
escrita, nunca antes.

---

### (8) Indexação

**Responsabilidade**: tornar o dado persistido **descobrível** —
distinto de "existir". Inclui: invalidar/atualizar `CacheProvider`
(Infrastructure, já implementado) para qualquer leitura que dependa do
registro afetado (ex: `GetRankingQuery` cacheado); sinalizar que a
categoria do registro é candidata a `GenerateRankingUseCase` rodar de
novo (não roda automaticamente a cada avaliação — ver Domain Model §3.4,
`Ranking` é gerado sob demanda); e, no futuro, atualizar um índice de
busca full-text dedicado (hoje `SearchSupplementsUseCase` busca direto
no repositório — funciona até a escala em que um índice de busca
dedicado, ex: Postgres full-text ou um serviço externo, se tornar
necessário).

**Síncrono ou assíncrono**: **candidato natural a assíncrono** — nada
que dependa de indexação precisa estar pronta no mesmo milissegundo em
que o admin salva um cadastro; um pequeno atraso de "aparecer na
busca"/"cache atualizado" é aceitável e é exatamente o tipo de tarefa
que uma fila (`QueueProvider`) resolve bem.

**Evento de domínio**: `SuplementoIndexado` (novo, §6) — o evento
"final" do pipeline; sua ausência (nunca disparado) é, na prática, o
sinal de que algo no pipeline não completou.

## 3. Diagrama de estados de um registro de importação

```
RECEBIDO ──► VALIDADO ──► NORMALIZADO ──► DEDUPLICADO ──► ENRIQUECIDO ──► AVALIADO ──► PERSISTIDO ──► INDEXADO
   │             │              │               │                                        │
   │             │              │               ▼                                        │
   │             │              │      AGUARDANDO_REVISAO_MANUAL                          │
   │             │              │      (duplicidade ambígua)                              │
   │             │              ▼                                                          │
   │             │      AGUARDANDO_MAPEAMENTO_DE_CATEGORIA                                │
   │             ▼                                                                          │
   │        REJEITADO (erro de validação — terminal para este registro,                     │
   │         não bloqueia os demais do lote)                                                │
   ▼                                                                                         ▼
 FALHOU_NA_ENTRADA                                                                  (pipeline completo,
 (arquivo ilegível — terminal)                                                       ver Estágio 8)
```

Cada estado terminal exceto `INDEXADO` é uma parada explícita, nunca um
silêncio — todo registro que não completa o pipeline inteiro tem um
estado nomeado e consultável (via o `Importacao` pai, Domain Model
§3.9), nunca "simplesmente desaparece".

## 4. Estratégias específicas

### 4.1 Produtos duplicados

Ordem de verificação em Deduplicação (Estágio 4), da mais para a menos confiável:

1. **GTIN/EAN idêntico** (quando presente em ambos) → é o mesmo `SKU`,
   sem ambiguidade. Atualiza o existente.
2. **Slug idêntico** (mesmo nome+marca normalizados) → mesmo
   `Suplemento`, alta confiança. Atualiza.
3. **Similaridade de nome+marca acima de um limiar** (ex: distância de
   edição normalizada) **sem** GTIN nem slug batendo → **não decide
   sozinho** — vai para `AGUARDANDO_REVISAO_MANUAL` com os candidatos
   sugeridos. Um falso positivo aqui (fundir dois produtos diferentes)
   é pior que pedir revisão humana a mais.
4. **Nenhuma correspondência** → registro novo, cria `Suplemento`/`SKU`.

### 4.2 Mudança de embalagem

Mudança de embalagem (ex: 300g → 250g, ou redesign visual sem mudar
fórmula) **não é uma mudança de `Suplemento`** — o produto continua
sendo "o mesmo suplemento", mas pode ser uma mudança de `SKU` (se o
GTIN mudar, o que é comum — GTIN é por embalagem, não por fórmula) ou
só uma atualização de `Imagem`/atributo do `SKU` existente (se o GTIN
não mudar). Regra: **GTIN novo → `SKU` novo**, com o `SKU` antigo
transicionando para `DESCONTINUADO` (nunca apagado — seu
`HistoricoDePreco` continua consultável). GTIN igual → atualização do
`SKU` existente.

### 4.3 Mudança de SKU (descontinuação/substituição)

Quando um `SKU` para de aparecer nas origens de dado por um período
configurável (ex: 60 dias sem nenhuma `Importacao` o mencionar), ele
transiciona de `ATIVO` para `DESCONTINUADO` automaticamente — nunca é
apagado. Se uma importação subsequente identificar claramente "este é o
sucessor" (ex: mesmo `Suplemento`, GTIN novo, nome quase idêntico salvo
o peso), o pipeline registra essa relação como metadado do novo `SKU`
(`sucessorDe`), útil para a UI mostrar "esta versão substituiu a
anterior" — mas essa inferência **nunca é automática com alta
confiança**; cai na mesma fila de revisão manual de §4.1.3 quando a
correspondência não é óbvia.

### 4.4 Histórico de preços

Já resolvido no Domain Model (§3.2, `HistoricoDePreco`): toda captura de
preço, de qualquer origem, gera uma nova entrada append-only — nunca
edita uma anterior. O pipeline de importação não introduz nenhuma regra
nova aqui além de "toda passagem pelo Estágio 7 (Persistência) que
envolve preço grava, nunca atualiza".

### 4.5 Histórico de avaliações

Mesmo princípio (Domain Model §3.3, `Avaliacao`): o pipeline nunca
"corrige" uma `Avaliacao` antiga — reprocessar (§4.7) sempre produz uma
`Avaliacao` nova. O histórico completo de como a nota de um produto
evoluiu é, por construção, nunca perdido.

### 4.6 Versionamento de metodologia

Fora do escopo direto deste pipeline (`packages/core`/`packages/application`
já resolvem isso — `MethodologyVersion`, `ReviseMethodologyUseCase`), mas
o pipeline **depende** dessa decisão em um ponto: o Estágio 6
(Avaliação) sempre usa a `VersaoDaMetodologia` **vigente** no momento em
que o registro passa por aquele estágio — nunca uma versão fixada
antecipadamente no início do pipeline. Consequência prática: se a
metodologia mudar de versão _durante_ o processamento de um lote grande,
registros processados antes e depois da mudança legitimamente usam
versões diferentes — isso é correto, não um bug (cada `Avaliacao` já
registra qual versão usou).

### 4.7 Reprocessamento

Reprocessar = rodar o pipeline de novo para um `Suplemento`/`SKU` que já
existe, tipicamente para: (a) uma nova versão de metodologia querer uma
`Avaliacao` recalculada, (b) uma correção de dado de origem, (c) uma
falha anterior em um estágio intermediário.

**Requisito de idempotência**: reprocessar o mesmo registro de entrada
duas vezes produz o mesmo resultado (mesmo `Suplemento`/`SKU`
atualizado, não duplicado) — isso é o que a chave de deduplicação (§4.1)
garante estruturalmente. Reprocessamento **sempre** passa pelos 8
estágios de novo, do zero — nunca "retoma de onde parou" reaproveitando
resultado de um enriquecimento antigo, porque o próprio enriquecimento
pode ter mudado.

**Gatilhos de reprocessamento em lote**: nova versão de metodologia
publicada para uma categoria (reprocessa Avaliação de todos os
Suplementos daquela categoria); correção manual de um dado de origem
identificado como sistematicamente errado.

### 4.8 Importações parciais

Já embutido na filosofia do pipeline (§2, "por registro, nunca por
lote"): um `Importacao` com 1000 registros onde 950 têm sucesso e 50
falham termina com status `CONCLUIDA_COM_ERROS` (Domain Model §3.9),
não `FALHOU`. Os 950 são efetivos imediatamente; os 50 ficam
registrados com o motivo exato da falha (qual estágio, qual erro) para
correção e reprocessamento pontual — nunca é preciso reenviar o arquivo
inteiro para corrigir 50 linhas.

### 4.9 Rollback

**O que pode ser desfeito**: o _efeito administrativo_ de uma
importação — ex: se um `Administrador` perceber que uma importação
inteira usou uma fonte errada, é possível marcar aquele `Importacao`
como `REVERTIDA` e todos os `Suplemento`/`SKU` que ela **criou** (não
os que só _atualizou_) voltam para `RASCUNHO`/`DESPUBLICADO`, saindo de
circulação pública imediatamente.

**O que nunca pode ser desfeito**: `HistoricoDePreco` e `Avaliacao` já
gravados — são fatos históricos imutáveis por design (§4.4, §4.5).
"Reverter" uma importação não apaga que, naquele momento, aquele preço
foi de fato observado — apagar isso destruiria a integridade do
histórico para sempre corrigir um erro pontual. A correção correta é:
gerar uma nova entrada/avaliação com o dado certo, deixando a trilha de
que a anterior estava errada visível (a própria `Auditoria`, §4.10,
registra a reversão).

**Rollback nunca é automático** — sempre uma ação deliberada de um
`Administrador`, nunca disparada pelo próprio pipeline detectando uma
anomalia (o pipeline sinaliza, não decide sozinho reverter).

### 4.10 Auditoria

Toda transição de estado relevante de um registro dentro do pipeline
(rejeitado, indo para revisão manual, persistido, revertido) gera uma
entrada em `Auditoria` (Domain Model §3.9 / `AuditLogPort`, já
implementado) com o `Importacao` como entidade relacionada. Isso é o
que permite reconstruir, meses depois, "por que este Suplemento tem os
dados que tem" — remontando a cadeia completa: qual `Importacao`, qual
origem, quais estágios passou, quem (ou qual processo agendado)
disparou.

## 5. Síncrono hoje vs. candidato a assíncrono amanhã

| Estágio            | Hoje                                   | Motivo                                          | Assíncrono faria sentido quando...                                                                                                                                                                                |
| ------------------ | -------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entrada            | Síncrono (cadastro manual/CSV pequeno) | Resposta imediata esperada pelo usuário         | Arquivo muito grande (milhares de linhas) — dividir em chunks processados por `QueueProvider`                                                                                                                     |
| Validação          | Síncrono                               | Barato, sem I/O                                 | Nunca precisa — é sempre rápido                                                                                                                                                                                   |
| Normalização       | Síncrono                               | Transformação pura, sem I/O                     | Nunca precisa                                                                                                                                                                                                     |
| Deduplicação       | Síncrono                               | Precisa decidir antes de seguir                 | Em lote muito grande, paralelizável por partição de categoria — mas continua síncrono _por registro_                                                                                                              |
| **Enriquecimento** | Síncrono, best-effort com timeout      | Simplicidade da Fase 0                          | **Primeiro candidato real** — I/O externo de latência variável; mover para depois da Persistência (enriquecimento assíncrono revisita e atualiza) evita que uma API de marketplace lenta trave o cadastro inteiro |
| Avaliação          | Síncrono                               | Cálculo puro, rápido, sem I/O (`packages/core`) | Não precisa — o custo não cresce com escala de plataforma                                                                                                                                                         |
| Persistência       | Síncrono                               | Nunca reportar sucesso sem ter gravado          | Nunca deveria ser assíncrono                                                                                                                                                                                      |
| **Indexação**      | Síncrono                               | Simplicidade da Fase 0                          | **Segundo candidato real** — cache/busca podem atualizar com alguns segundos de atraso sem problema nenhum para o usuário                                                                                         |

**Conclusão de design**: o pipeline inteiro já funciona hoje de forma
100% síncrona (viável enquanto o volume for baixo — Fase 0, dezenas a
centenas de produtos) sem nenhuma mudança estrutural quando Enriquecimento
e Indexação migrarem para assíncrono — porque `QueueProvider` (Infrastructure)
já existe como interface pronta, e os dois estágios já são desenhados
como "não bloqueiam o resultado principal" mesmo rodando síncronos hoje.

## 6. Catálogo de eventos de domínio do pipeline

Complementa (não substitui) o catálogo do Domain Model §5 — estes são
específicos do processo de ingestão, não do ciclo de vida das entidades
em si.

| Evento                                   | Disparado por   | Carrega                                             |
| ---------------------------------------- | --------------- | --------------------------------------------------- |
| `ImportacaoIniciada`                     | Entrada         | origem, tamanho do lote esperado                    |
| `RegistroDeImportacaoRejeitado`          | Validação       | motivo, campo(s) inválido(s), linha/posição no lote |
| `DuplicidadePotencialDetectada`          | Deduplicação    | candidatos sugeridos, nível de confiança            |
| `RegistroEnriquecido`                    | Enriquecimento  | campos preenchidos, fonte de cada um                |
| `SuplementoPersistido` / `SkuPersistido` | Persistência    | id gerado, `Importacao` de origem                   |
| `SuplementoIndexado`                     | Indexação       | id, quais índices/caches foram atualizados          |
| `ImportacaoRevertida`                    | Rollback (§4.9) | quais Suplementos/SKUs voltaram a rascunho          |

Somados aos já existentes no Domain Model (`SuplementoAvaliado`,
`PrecoCapturado`, `ImportacaoConcluida`/`ImportacaoFalhou`), este é o
conjunto completo de sinais que qualquer consumidor futuro (um worker de
enriquecimento assíncrono, um painel de acompanhamento de importação em
tempo real, um webhook para o time de curadoria) pode se inscrever sem
precisar conhecer a implementação interna do pipeline.

## 7. Auditoria desta modelagem — o que fica para quando o volume crescer

- **Chave de deduplicação sem índice dedicado é o gargalo mais óbvio em
  escala** (§4, Estágio 4) — comparar contra "todo o catálogo" fica
  caro quando o catálogo tem milhares de itens; a solução (um índice
  invertido por GTIN/slug) é uma decisão de Infrastructure/banco, não
  deste documento, mas fica sinalizada aqui para quem desenhar o schema
  físico.
- **A fila de revisão manual (`AGUARDANDO_REVISAO_MANUAL`,
  `AGUARDANDO_MAPEAMENTO_DE_CATEGORIA`) não tem, hoje, nenhuma UI
  desenhada** — este documento define que o estado existe e é
  consultável, não como um humano de fato o resolve; isso é trabalho de
  Presentation, fora do escopo desta etapa.
- **Nenhum SLA de enriquecimento foi definido** (quanto tempo é
  aceitável entre "Suplemento persistido sem enriquecimento completo" e
  "enriquecimento assíncrono terminou") — decisão de produto, não de
  arquitetura, mas o pipeline já está desenhado para suportar qualquer
  SLA que for decidido, sem mudança estrutural.
- **Nada neste pipeline pressupõe qual banco será usado** — todos os
  Ports já existentes (`SupplementRepositoryPort`,
  `ImportSourcePort`, etc.) continuam sendo a única superfície que
  qualquer estágio toca; o pipeline está pronto para o Prisma ser
  conectado como próxima etapa, sem precisar ser redesenhado para isso.
