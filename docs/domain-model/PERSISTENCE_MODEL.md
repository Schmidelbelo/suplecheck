# SupleScore — Persistence Model & Audit

> Como [`../../prisma/schema.prisma`](../../prisma/schema.prisma) traduz,
> entidade por entidade, o que [`DOMAIN_MODEL.md`](./DOMAIN_MODEL.md) e
> [`../data-pipeline/DATA_PIPELINE.md`](../data-pipeline/DATA_PIPELINE.md)
> já definiram — e a auditoria completa desse resultado. Este documento
> não introduz nenhuma regra de negócio nova; onde parecer que introduz,
> é sinal de que algo devia estar nos documentos anteriores e não
> estava — nesse caso, ver §7 (lacunas encontradas).

## 1. Tabela de tradução (Domain Model → Schema)

| Domain Model (negócio, PT) | Schema (código, EN)                               | Nota                                                                  |
| -------------------------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| Suplemento / Produto       | `Product`                                         | Fundidos — Domain Model §2.1                                          |
| Categoria                  | `Category`                                        | —                                                                     |
| Marca                      | `Brand`                                           | —                                                                     |
| Fabricante                 | `Manufacturer`                                    | —                                                                     |
| SKU                        | `Sku`                                             | —                                                                     |
| Imagem                     | `ProductImage`                                    | —                                                                     |
| Loja                       | `Store`                                           | —                                                                     |
| Preço                      | _(sem tabela)_                                    | Value Object — campos `priceCents`/`currency` em `PriceEntry`         |
| Histórico de Preço         | `PriceEntry`                                      | —                                                                     |
| Critério                   | `Criterion`                                       | Espelha `Criterion`/`CriterionId` de `packages/core`                  |
| Metodologia                | `Methodology`                                     | —                                                                     |
| Versão da Metodologia      | `MethodologyVersion`                              | —                                                                     |
| (peso do critério)         | `MethodologyVersionCriterion`                     | Não é entidade do Domain Model — é o relacionamento N:N materializado |
| (bandas de classificação)  | `MethodologyClassificationBand`                   | idem                                                                  |
| (override por categoria)   | `MethodologyCategoryOverride`                     | Persistência de `CategoryOverride` (Domain de cálculo)                |
| (metodologia vigente)      | `CategoryActiveMethodology`                       | Persistência da regra "no máx. 1 vigente por categoria"               |
| Avaliação + Índice         | `ProductScore` + `ProductScoreCriterionBreakdown` | Fundidos — Domain Model §2.3                                          |
| Ranking                    | `Ranking` + `RankingEntry`                        | —                                                                     |
| Artigo                     | `Article`                                         | —                                                                     |
| Newsletter (Assinante)     | `Lead`                                            | Nome mantido da Fase 0 por continuidade — Domain Model §2.5           |
| Usuário                    | `User`                                            | —                                                                     |
| Administrador              | `AdminUser`                                       | Separado de `User` — Domain Model §3.7                                |
| Favoritos                  | `Favorite`                                        | —                                                                     |
| Alertas                    | `Alert`                                           | —                                                                     |
| Importações                | `ImportBatch` + `ImportRecordError`               | —                                                                     |
| Auditoria                  | `AuditLog`                                        | —                                                                     |
| Log                        | _(sem tabela)_                                    | Infraestrutura (`Logger`) — Domain Model §2.4                         |

**26 conceitos do pedido original, todos endereçados** — 21 como
tabela própria, 3 fundidos em outra tabela por decisão já justificada
nos documentos anteriores (Preço, Índice, Log), 2 sem necessidade de
tabela alguma pelos mesmos motivos.

## 2. O que foi deliberadamente OMITIDO da Fase 0

`Comparison`/`ComparisonItem` (existiam no `schema.prisma` da Fase 0)
**foram removidos**. Nenhum dos dois tem base em `DOMAIN_MODEL.md` —
comparar suplementos é uma operação de leitura sem estado
(`CompareSupplementsUseCase`, Application, já implementado, recebe uma
lista de ids a cada chamada; nada precisa ser persistido entre uma
comparação e outra). Mantê-los seria exatamente o "existir por
conveniência técnica" que a tarefa pediu para evitar — uma tabela
sobrevivendo só porque já tinha sido escrita, sem nenhuma entidade de
domínio ou estágio do pipeline exigindo persistência de sessão de
comparação.

Se um dia o produto quiser "comparações salvas" (ex: compartilhar um
link de comparação específica), isso é uma decisão de produto nova,
com sua própria entidade de Domain Model a ser desenhada então — não
uma tabela técnica reaproveitada sem essa etapa de modelagem.

## 3. Estratégia de persistência por entidade

> Formato: **Estratégia** (o padrão de escrita/leitura que a tabela
> segue) — **Por quê**. Constraints/índices específicos já estão
> comentados inline no `schema.prisma`; aqui o foco é a decisão de mais
> alto nível por trás de cada uma.

### Catalog

- **`Category`/`Brand`/`Manufacturer`/`Store`** — _Reference data, soft
  delete via `active`_. Nunca hard-deletadas (haveria histórico
  referenciando-as: `Product`, `PriceEntry`); `active=false` é
  suficiente porque nenhuma delas tem um lifecycle rico o bastante para
  justificar um enum de status próprio (diferente de `Product`/`Sku`).
- **`Product`** — _CRUD com máquina de estados (`ProductStatus`)_.
  Cardinalidade N:1 com `Category`/`Brand` porque, no mundo real, um
  suplemento tem exatamente uma categoria primária e uma marca — forçar
  N:N aqui adicionaria complexidade de consulta sem nenhum caso de uso
  real que precise de "um produto em duas categorias ao mesmo tempo"
  (Domain Model já decidiu isso: "sempre pertence a exatamente uma
  Categoria"). `manufacturerId` opcional porque, honestamente, na
  maioria das vezes essa informação não é conhecida.
- **`ProductImage`/`Sku`** — _Entidades filhas do agregado `Product`,
  cascade delete_. `onDelete: Cascade` é correto aqui porque, ao
  contrário de `Category`/`Brand` (dados de referência compartilhados),
  imagem e SKU **não têm sentido de existir fora de um Product** — são
  literalmente parte dele no Domain Model (§3.1: "membro do agregado").
  Apagar o Product sem apagar seus SKUs deixaria lixo órfão.

### Pricing

- **`PriceEntry`** — _Append-only, sem `updatedAt`, cascade delete a
  partir de `Sku`_. A tabela que mais cresce da plataforma (uma linha
  por captura) — projetada desde o início para milhões de linhas: sem
  update em lugar nenhum (nada de lock de escrita concorrente
  disputando a mesma linha), índice composto `(skuId, storeId,
capturedAt)` cobre a consulta mais comum ("preço mais recente deste
  SKU nesta loja") sem precisar de tabela derivada "preço atual"
  separada (que precisaria ser mantida em sincronia — fonte de bugs
  clássica).

### Evaluation

- **`Criterion`** — _Chave natural (`id` = kebab-case), não `cuid()`_.
  Decisão deliberada: a identidade de um critério **é** código
  (`Criterion.evaluate()`, `packages/core`) — usar `cuid()` aqui criaria
  dois identificadores para a mesma coisa (o id técnico no código, um
  id de banco arbitrário na tabela) que precisariam ser sincronizados
  manualmente. Uma única fonte de verdade de identidade evita essa
  classe inteira de bug.
- **`Methodology`/`MethodologyVersion`** — _Identidade estável +
  versões imutáveis_. `MethodologyVersion` não tem `updatedAt` — uma
  vez `PUBLISHED`, é constitucionalmente somente leitura (Domain Model
  §3.3); `@@unique([methodologyId, version])` é a mesma invariante que
  o Domain (`MethodologyVersion.of`) já valida em memória, repetida
  como constraint física para o caso (raro, mas possível) de dois
  processos tentarem publicar a mesma versão simultaneamente — o banco
  é a última linha de defesa, não a primeira.
- **`MethodologyVersionCriterion`/`MethodologyClassificationBand`** —
  _Tabelas de relacionamento/composição, não entidades de negócio
  próprias_. Existem porque `MethodologyVersion.assignments`/
  `classification` (Domain de cálculo) são coleções — SQL relacional
  não tem "array de objeto estruturado" de primeira classe sem virar
  JSON (ver §6 para quando JSON _é_ a escolha certa; aqui não é, porque
  cada linha tem identidade própria consultável — "quais versões usam o
  critério X" é uma pergunta real que uma tabela responde bem e um JSON
  blob não).
- **`MethodologyCategoryOverride`** — _JSON para `weightOverrides`,
  array nativo para `disabledCriterionIds`_. Ver justificativa
  detalhada em §6.
- **`CategoryActiveMethodology`** — _`categoryId` como chave primária,
  não `id` próprio_. A decisão de design mais "afiada" deste schema:
  torna "no máximo uma metodologia vigente por categoria" uma
  impossibilidade estrutural (não dá pra inserir uma segunda linha com
  a mesma PK), em vez de uma regra de aplicação que poderia, por bug,
  ser violada.
- **`ProductScore`** — _Append-only, com `categoryId` denormalizado_.
  Ver justificativa completa em §5 (o único campo verdadeiramente
  denormalizado deste schema, e o porquê vale a pena).
- **`ProductScoreCriterionBreakdown`** — _Filha de `ProductScore`,
  cascade delete, `notes`/`flags` em JSON_. Ver §6.

### Ranking

- **`Ranking`/`RankingEntry`** — _Snapshot imutável_. `RankingEntry.finalScore`
  é uma cópia do valor no momento da geração, não uma referência viva a
  `ProductScore` — decisão já justificada no Domain Model (§3.4): um
  ranking de janeiro não deve mudar de números em fevereiro só porque
  um produto foi reavaliado.

### Content / Growth / Identity

- **`Article`** — _CRUD simples com status_. Sem surpresas — o
  conteúdo editorial não tem a complexidade de versionamento que
  `MethodologyVersion` tem porque não existe a mesma exigência de
  auditabilidade histórica rígida (um artigo pode ser só editado).
- **`Lead`** — _Nome mantido da Fase 0 (não renomeado para
  "NewsletterSubscriber")_, porque o módulo `leads` já implementado na
  Application Layer (`modules/leads`, Fase 0) já usa esse vocabulário
  em código — renomear a tabela sem renomear o módulo criaria uma
  divergência de nome pior do que a que existe hoje entre o termo do
  Domain Model e o termo do código.
- **`User`/`AdminUser`** — _Duas tabelas, nunca uma com uma coluna
  "tipo"_. Já justificado no Domain Model (§3.7) — misturar as duas
  numa tabela com um campo discriminador é o tipo de atalho que
  historicamente já causou vazamento de permissão administrativa por
  bug de aplicação; separar fisicamente torna essa classe de erro
  estruturalmente mais difícil de acontecer.

### Personalization / Platform Operations

- **`Favorite`** — _Tabela de junção pura, `@@unique([userId,
productId])`_. A unique constraint é o que torna "favoritar de novo"
  idempotente no nível do banco, não só da Application (defesa em
  profundidade).
- **`Alert`** — _Enum de status rico (`ACTIVE/PAUSED/TRIGGERED/EXPIRED`)_,
  porque, ao contrário de `Favorite` (binário: existe ou não), um
  alerta tem lifecycle real que o produto precisa consultar ("quantos
  alertas já dispararam esta semana").
- **`ImportBatch`/`ImportRecordError`** — _A materialização direta do
  Data Pipeline_. Ver §4 — cada estado nomeado no pipeline (`REJEITADO`,
  `AGUARDANDO_REVISAO_MANUAL`, etc.) tem um lugar exato para existir
  nestas duas tabelas.
- **`AuditLog`** — _Append-only, nunca editada/apagada pelo fluxo
  normal_. `actorAdminId` opcional + `actorType` — quando `SYSTEM`, não
  há admin para referenciar (uma reavaliação agendada, por exemplo).

## 4. Revisão do Data Pipeline contra o novo modelo

Confirmação, estágio a estágio, de que o pipeline já desenhado
persiste corretamente neste schema — nenhum estágio precisou de
redesenho; o schema é quem se adaptou ao pipeline, nunca o contrário.

| Estágio            | Persiste em                                                                                                                                                                     | Confirmação                                                                                                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (1) Entrada        | `ImportBatch` (criado)                                                                                                                                                          | `source` (string livre) aceita qualquer origem nova sem migration — Data Pipeline §1 exigia exatamente isso                                                                                                                                          |
| (2) Validação      | `ImportRecordError` (`severity=ERROR`, `stage=VALIDATION`)                                                                                                                      | Falha por registro, não por lote — `rawData` (JSON) preserva a linha original para correção pontual, sem reenviar o arquivo (Data Pipeline §4.8)                                                                                                     |
| (3) Normalização   | _(sem persistência própria)_                                                                                                                                                    | Transformação pura antes de chegar a `Product`/`Sku` — mas quando a categoria de origem não mapeia, vira `ImportRecordError` (`severity=NEEDS_REVIEW`, `stage=NORMALIZATION`) — exatamente o estado `AGUARDANDO_MAPEAMENTO_DE_CATEGORIA` do pipeline |
| (4) Deduplicação   | `Sku.gtin` (unique), `Product.slug` (unique) para o caminho feliz; `ImportRecordError` (`severity=NEEDS_REVIEW`, `stage=DEDUPLICATION`, `suggestedMatches`) para o caso ambíguo | As 3 camadas de decisão do Data Pipeline §4.1 têm, cada uma, um destino físico exato                                                                                                                                                                 |
| (5) Enriquecimento | Atualiza campos de `Product`/`Sku`/`PriceEntry` já criados                                                                                                                      | Nunca bloqueia — não tem "tabela de erro" própria porque, por definição (Data Pipeline §2), falhar aqui não impede o registro de seguir adiante                                                                                                      |
| (6) Avaliação      | `ProductScore` + `ProductScoreCriterionBreakdown`                                                                                                                               | `source` (`MANUAL/IMPORT/SCHEDULED_RECALC`) registra a proveniência exigida pelo pipeline                                                                                                                                                            |
| (7) Persistência   | `Product`/`Sku`/`PriceEntry`/`ProductScore` (linhas efetivas)                                                                                                                   | `importBatchId` em `PriceEntry` e `ProductScore` é o que amarra o dado ao lote que o produziu — rastreabilidade completa                                                                                                                             |
| (8) Indexação      | _(sem tabela nova)_                                                                                                                                                             | Fora do escopo de persistência relacional — invalidação de `CacheProvider` e geração de `Ranking` (Infrastructure/Application, já implementados)                                                                                                     |

**Rollback (Data Pipeline §4.9)**: `ImportBatch.revertedAt` marca a
reversão; os `Product`/`Sku` que aquele lote **criou** (não os que só
atualizou) devem voltar para `DRAFT`/`UNPUBLISHED` — uma operação de
aplicação (não uma cascade de banco, porque a decisão "isto foi
criado por este lote ou só tocado por ele" não é uma pergunta que uma
constraint de FK responde sozinha). `HistoricoDePreco`/`Avaliacao`
(`PriceEntry`/`ProductScore`) nunca são apagados por um rollback —
consistente com Data Pipeline §4.9: "o que nunca pode ser desfeito".

**Conclusão**: todas as 8 etapas persistem corretamente. Nenhuma
exigiu uma tabela que não fosse já justificável pelo Domain Model
sozinho — o pipeline não introduziu nenhuma entidade nova de negócio,
só as duas tabelas operacionais (`ImportBatch`/`ImportRecordError`) que
o próprio Domain Model já previa (§3.9, `Importacao`).

## 5. O único campo denormalizado — e por que

`ProductScore.categoryId` duplica `ProductScore.product.categoryId`.
Esta é a única denormalização deliberada de todo o schema, e existe por
um motivo específico e mensurável: `GenerateRankingUseCase` (Application,
já implementado) precisa, toda vez que roda, de "a última nota de cada
produto de uma categoria" — sem o campo denormalizado, essa consulta
exigiria `JOIN Product ON ProductScore.productId = Product.id WHERE
Product.categoryId = ?` toda vez, em uma tabela (`ProductScore`) que
cresce continuamente. Com o campo denormalizado, é um `WHERE
categoryId = ? ORDER BY calculatedAt DESC` direto sobre um índice
composto (`@@index([categoryId, calculatedAt])`) — sem join.

**O risco desta denormalização** (e por que ele é aceitável aqui): se
`Product.categoryId` mudar depois que já existem `ProductScore`
antigos, os scores antigos manteriam a categoria antiga. **Isso é
correto, não um bug** — um `ProductScore` é um fato histórico ("nesta
data, com esta metodologia, este produto teve esta nota") e a
metodologia usada já era a da categoria de origem; se o produto mudar
de categoria, as avaliações anteriores continuam corretamente
associadas ao contexto em que foram calculadas, mesmo estampilhas.
Recategorizar um produto não deveria, silenciosamente, reescrever seu
histórico de avaliação.

Nenhum outro campo do schema é denormalizado — toda outra
"duplicação aparente" (ex: `RankingEntry.finalScore`) já foi justificada
como cópia intencional de um valor histórico, não como atalho de
performance.

## 6. JSON vs. tabela — critério usado

Três campos usam `Json` neste schema
(`Product.attributes`, `MethodologyCategoryOverride.weightOverrides`,
`ProductScoreCriterionBreakdown.notes`/`flags`). O critério para não
normalizar em tabela, em todos os três casos, é o mesmo: **o dado é
sempre lido/escrito como um bloco inteiro pela camada de Application
(via `MethodologyMapper`/`IndexResultMapper`, já implementados), nunca
filtrado por uma cláusula `WHERE` em um subcampo dele.** No momento em
que qualquer um desses precisar ser consultado por SQL (ex: "produtos
com sabor 'chocolate'" filtrando dentro de `attributes`), a resposta
certa é promover aquele campo específico para uma coluna própria — não
migrar a estrutura toda para tabela relacional antecipadamente sem essa
necessidade confirmada (mesmo princípio de "não modelar por
conveniência" aplicado à direção oposta: não normalizar prematuramente
também é uma forma de over-engineering).

`MethodologyVersionCriterion`/`MethodologyClassificationBand`, em
contraste, **são** tabelas — porque, ao contrário dos três casos acima,
"quais versões usam o critério X" e "quantos produtos caem em cada
faixa de classificação" são perguntas reais que a plataforma precisa
responder (relatório administrativo, análise de metodologia), então a
estrutura relacional paga por si mesma.

## 7. Auditoria final

### 7.1 Integridade referencial

Toda relação obrigatória do Domain Model (Product→Category,
Product→Brand, Sku→Product, PriceEntry→Sku, PriceEntry→Store,
ProductScore→Product, ProductScore→MethodologyVersion...) é uma FK
`NOT NULL` no schema — não existe nenhum relacionamento "obrigatório
por convenção da aplicação, mas opcional no banco" (a categoria clássica
de bug de integridade). As únicas FKs opcionais (`Product.manufacturerId`,
`ImportBatch.triggeredByAdminId`, `PriceEntry.importBatchId`,
`ProductScore.importBatchId`, `AuditLog.actorAdminId`,
`Sku.successorSkuId`) são exatamente os casos que o Domain Model já
descreve como legitimamente opcionais — nenhuma opcionalidade "por
segurança"/"por via das dúvidas".

### 7.2 Performance esperada

Os três padrões de consulta mais frequentes da plataforma (definidos
pelo próprio Data Pipeline/Domain Model, não inventados aqui) têm
índice dedicado:

1. "Produtos publicados de uma categoria" → `Product(categoryId, status)`.
2. "Preço mais recente de um SKU numa loja" → `PriceEntry(skuId, storeId, capturedAt)`.
3. "Última nota de cada produto de uma categoria" (Ranking) → `ProductScore(categoryId, calculatedAt)` + denormalização (§5).

Nenhum destes exige um índice composto de mais de 3 colunas nem um
índice parcial — os dois tipos de índice que mais custam para manter em
volume de escrita alto (`PriceEntry` é a tabela de maior volume de
escrita da plataforma) e que este schema evita deliberadamente.

### 7.3 Gargalos possíveis (honestos, não escondidos)

- **`PriceEntry` e `ProductScore` crescem sem limite natural.** Já
  sinalizado no Data Pipeline (§7) e no Domain Model (§7) — este schema
  não resolve isso (não é um problema de modelagem lógica, é de
  volume físico/particionamento) e não finge resolver: fica como
  decisão de infraestrutura de banco (partitioning por data, ex.
  `capturedAt`) para quando o volume justificar.
- **Deduplicação por similaridade de nome (Data Pipeline §4.1.3) não
  tem suporte de índice de banco** — `Sku.gtin`/`Product.slug` são
  únicos e indexados (caminho feliz rápido), mas comparação de
  similaridade textual (fuzzy match) não é uma operação que um índice
  B-tree comum acelera; se o volume de importação sem GTIN crescer
  muito, isso vai exigir uma extensão de banco dedicada (ex.
  `pg_trgm` no Postgres) — não modelada aqui porque é uma decisão de
  infraestrutura física, fora do escopo conceitual deste documento.
- **`ImportRecordError.rawData` (JSON) pode crescer descontroladamente
  em uma importação com muitos erros** — aceitável para o volume da
  Fase 0/1, merece revisão (ex: TTL/arquivamento) quando importação em
  massa de marketplace virar rotina diária.

### 7.4 Campos redundantes

Nenhum encontrado além do único denormalizado já justificado (§5).
Especificamente verificado e descartado como redundância:
`Product.attributes` (JSON) vs. colunas próprias — não são a mesma
informação, `attributes` é precisamente o que varia por categoria e
por isso não pode ser uma coluna fixa.

### 7.5 Relacionamentos desnecessários

`Comparison`/`ComparisonItem` da Fase 0 identificados e removidos (§2)
— o único relacionamento desnecessário encontrado nesta auditoria.
Todo relacionamento restante tem pelo menos um Use Case (Application,
já implementado) ou uma consulta explícita do Data Pipeline que o
utiliza — não sobrou nenhum "relacionamento por simetria" (ex: não
existe `Category.products` só porque "faz sentido ter os dois lados"
sem que algo o consuma — `Category.products` é usado por
`SearchSupplementsUseCase`/listagem de catálogo).

### 7.6 Normalização

O schema está em 3FN (Terceira Forma Normal) em todas as tabelas
exceto o único ponto de denormalização deliberada e justificada (§5).
Nenhuma tabela mistura dois conceitos que deveriam ser entidades
separadas (o erro clássico de sub-normalização) nem fragmenta um
conceito único em tabelas demais sem necessidade de consulta real
(sobre-normalização) — os três casos de "poderia ser mais uma tabela"
(§6, campos JSON) foram avaliados e decididos contra, com justificativa
explícita.

### 7.7 Futuras migrações previsíveis

Registradas aqui para que apareçam como extensão aditiva quando
chegar a hora, não como retrabalho de modelagem:

1. **Billing/Assinatura** (Domain Model §6.1) — novo Bounded Context,
   novas tabelas (`Plan`, `Subscription`, `Payment`), FK a partir de
   `User` — não exige alterar nenhuma tabela existente.
2. **Avaliação de usuário final** (Domain Model §6.2) — nova tabela
   (`UserReview` ou similar), independente de `ProductScore` — aditiva.
3. **Canal de notificação de Alerta** (Domain Model §6.3) — nova tabela
   (`AlertNotification`: `alertId`, canal, status de entrega) — aditiva,
   FK a partir de `Alert` existente.
4. **Índice de busca full-text dedicado** (Data Pipeline §7) — não é
   uma migration deste schema, é uma decisão de infraestrutura
   adicional (ex: extensão `pg_trgm`/`tsvector` do Postgres, ou um
   serviço externo) que consome os dados já aqui, sem alterá-los.
5. **Particionamento de `PriceEntry`/`ProductScore`** (§7.3) — mudança
   de infraestrutura física (partition by range em `capturedAt`/
   `calculatedAt`), não de schema lógico — os models Prisma não
   precisam mudar quando isso acontecer.

Nenhuma dessas 5 exige alterar uma tabela existente de forma destrutiva
— todas são puramente aditivas, o que confirma que o modelo atual não
está "torto" em nenhum eixo que essas extensões previsíveis exporiam.

## 8. Veredito

O schema em `prisma/schema.prisma` está pronto para servir de base da
plataforma pelos próximos anos: toda entidade tem justificativa
rastreável até o Domain Model ou o Data Pipeline (nenhuma por
conveniência técnica), toda relação obrigatória é uma FK `NOT NULL`,
os três padrões de consulta mais quentes têm índice dedicado, a única
denormalização é medida e justificada, e as extensões previsíveis dos
próximos anos (premium, comunidade, notificação, busca, particionamento)
são todas aditivas. Ainda não conectado — Prisma Client foi gerado
apenas para validar que o schema compila sem ambiguidade de tipos;
nenhuma migration foi executada contra um banco real.
