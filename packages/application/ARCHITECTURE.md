# SupleCheck Application Layer — Arquitetura

> Este documento descreve `packages/application`, a camada de
> orquestração entre o Core Domain (`packages/core`) e o resto do mundo
> (Infrastructure, Presentation). Ver [`../core/ARCHITECTURE.md`](../core/ARCHITECTURE.md)
> para a arquitetura do Domain e [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md)
> para a plataforma como um todo.

## 1. Por que esta camada existe

O Core Domain sabe calcular um Índice a partir de fatos e uma
metodologia — e só isso. Ele não sabe o que é "cadastrar um suplemento",
não sabe buscar dados em lugar nenhum, não sabe o que é uma página, uma
API ou um banco. A Application Layer é quem transforma "o que o usuário
quer fazer" (cadastrar, avaliar, comparar, gerar ranking...) em uma
sequência de chamadas ao Domain — e é a **única** camada autorizada a
fazer essa ponte. Nenhum Controller, rota de API ou componente React
chama `packages/core` diretamente; todos passam por um Use Case daqui.

## 2. As quatro camadas e a regra de dependência

```
Presentation   (futuro: páginas, componentes, Server Actions)
     │  depende de
     ▼
Application    (este pacote — Use Cases, Ports, DTOs, Services)
     │  depende de
     ▼
Domain         (packages/core — regras de negócio puras)

Infrastructure (futuro: Prisma, APIs externas, filas)
     │  depende de
     ▼
Application    (implementa os Ports declarados aqui)
```

A seta nunca aponta para trás. Em particular:

- **Domain nunca importa Application.** Verificado — `packages/core/src`
  não tem nenhuma referência real a `application` fora de comentários
  (ver §8, auditoria).
- **Application só toca Domain através de um único arquivo**,
  `src/domain-kernel.ts` — todo o resto do pacote importa Domain
  indiretamente por ali. Isso existe para que a regra "Application →
  Domain, nunca o contrário" seja verificável com um grep, não só uma
  convenção de código review (ver §8).
- **Infrastructure vai depender de Application, nunca o contrário.**
  Hoje não existe nenhum código de Infrastructure — só os Ports que ela
  vai implementar. `packages/application` não importa Prisma, HTTP,
  banco de dados ou qualquer SDK externo (zero dependências no
  `package.json`, igual ao Core Domain).
- **Presentation vai depender de Application, nunca o contrário.** Hoje
  não existe nenhuma página nem componente conectado — confirmado no
  código atual de `src/` (o app Next.js) via grep (§8): nada em `src/`
  importa `packages/application` ou `packages/core` ainda. Essa
  desconexão é deliberada nesta etapa.

## 3. Vocabulário e onde cada peça vive

```
packages/application/
├── domain-kernel.ts        Único ponto de import de packages/core
├── shared/                  UseCase<T,R> (contrato comum), Pagination
├── errors/                   ApplicationError e subclasses
├── dto/                       Formas públicas (nunca entidade de Domain)
├── commands/                   Intenção de escrita (Register, Evaluate, Revise...)
├── queries/                     Intenção de leitura (Search, Compare, GetRanking...)
├── ports/                        Interfaces que Infrastructure implementa
├── mappers/                       DTO ⇄ entidade de Domain (só aqui essa travessia acontece)
├── factories/                      EvaluationContextFactory, SupplementProfileFactory, UseCaseFactory
├── policies/                        Regras que cruzam mais de um repositório/agregado
├── validators/                       Valida a FORMA de um Command antes do Domain validar a invariante
├── use-cases/                         Um caso de uso = uma pasta por domínio (supplement/catalog/methodology/ranking/platform)
└── services/                           Application Services — fachadas que agrupam Use Cases relacionados
```

| Conceito                  | Papel                                                                                                             | Exemplo                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Use Case**              | Uma operação de negócio completa, ponta a ponta                                                                   | `EvaluateSupplementUseCase`                                                     |
| **Application Service**   | Fachada que agrupa Use Cases relacionados para quem consome de fora                                               | `SupplementApplicationService`                                                  |
| **Command**               | Intenção de _escrita_ — dado de entrada de um Use Case que muda estado                                            | `RegisterSupplementCommand`                                                     |
| **Query**                 | Intenção de _leitura_ — dado de entrada de um Use Case que só lê                                                  | `SearchSupplementsQuery`                                                        |
| **DTO**                   | Forma de dado que atravessa a fronteira desta camada — nunca uma entidade de Domain                               | `SupplementDTO`, `IndexResultDTO`                                               |
| **Port**                  | Interface que a Application precisa, mas não implementa — Infrastructure implementa depois                        | `SupplementRepositoryPort`                                                      |
| **Mapper**                | Converte DTO ⇄ entidade de Domain — o único lugar onde os dois tipos coexistem                                    | `MethodologyMapper`                                                             |
| **Factory**               | Monta um objeto de Domain a partir de um Command/DTO, ou monta os próprios Use Cases                              | `EvaluationContextFactory`, `UseCaseFactory`                                    |
| **Policy**                | Regra de negócio que precisa de mais de um repositório (não cabe como invariante de uma única entidade de Domain) | `SupplementRegistrationPolicy` (checa slug único + categoria + marca existirem) |
| **Application Validator** | Valida a forma de um Command antes de tentar montar algo do Domain                                                | `RegisterSupplementValidator`                                                   |
| **Application Error**     | Vocabulário de erro desta camada — um `DomainError` nunca deveria escapar sem virar um destes                     | `SupplementNotFoundError`                                                       |

## 4. Os Use Cases e as 17 operações pedidas

| Operação pedida              | Use Case                        | Status                                                                                |
| ---------------------------- | ------------------------------- | ------------------------------------------------------------------------------------- |
| Cadastrar suplemento         | `RegisterSupplementUseCase`     | Completo                                                                              |
| Atualizar suplemento         | `UpdateSupplementUseCase`       | Completo                                                                              |
| Avaliar suplemento           | `EvaluateSupplementUseCase`     | Completo (orquestra `CalculateIndexUseCase` + persistência + auditoria + analytics)   |
| Calcular Índice              | `CalculateIndexUseCase`         | Completo (primitivo puro, sem persistência — chamado por `EvaluateSupplementUseCase`) |
| Gerar Ranking                | `GenerateRankingUseCase`        | Completo                                                                              |
| Buscar suplementos           | `SearchSupplementsUseCase`      | Completo                                                                              |
| Comparar suplementos         | `CompareSupplementsUseCase`     | Completo                                                                              |
| Listar categorias            | `ListCategoriesUseCase`         | Completo                                                                              |
| Listar marcas                | `ListBrandsUseCase`             | Completo                                                                              |
| Cadastrar metodologia        | `CreateMethodologyUseCase`      | Completo                                                                              |
| Versionar metodologia        | `ReviseMethodologyUseCase`      | Completo                                                                              |
| Cadastrar critérios          | `RegisterCriterionUseCase`      | Completo, com escopo explícito (ver §5)                                               |
| Ativar/desativar critérios   | `SetCriterionStatusUseCase`     | Completo, com limitação documentada (ver §6)                                          |
| Gerenciar pesos              | `UpdateCriterionWeightsUseCase` | Completo (delega a `ReviseMethodologyUseCase`)                                        |
| Importar dados               | `ImportDataUseCase`             | **Esqueleto deliberado** (ver §7)                                                     |
| Exportar dados               | `ExportDataUseCase`             | **Esqueleto deliberado** (ver §7)                                                     |
| Registrar auditoria          | `RecordAuditEntryUseCase`       | Completo                                                                              |
| Registrar analytics internos | `RecordAnalyticsEventUseCase`   | Completo                                                                              |

15 de 17 operações têm Use Case funcionalmente completo (validado no
smoke test, §9); 2 são esqueletos deliberados por decisão explícita de
escopo, não por lacuna esquecida.

## 5. Por que "Cadastrar Critérios" não aceita lógica nova por dado

Um critério é código: a classe implementa `Criterion.evaluate()`, uma
função real que decide como calcular uma nota a partir de fatos. Não
existe forma seria de "cadastrar" essa lógica através de um formulário
ou um Command JSON sem reinventar uma linguagem de regras dentro da
plataforma — o que adicionaria complexidade sem necessidade real hoje.

Por isso `RegisterCriterionCommand` recebe uma instância de `Criterion`
(um tipo de Domain) diretamente — a única exceção deliberada à regra
"Commands nunca carregam tipo de Domain". A leitura correta é: **um
critério novo sempre nasce como código**, revisado como qualquer PR de
Domain; o Use Case só torna esse código _disponível_ na plataforma
(`CriterionRegistry`). Quem chama `RegisterCriterionUseCase` é sempre
código de composição/infraestrutura interna (ex: um script de bootstrap
que registra os critérios embutidos + os que uma equipe implementou),
nunca uma rota de API pública recebendo JSON de um usuário externo.

`CompositeCriterion` (Domain) é a via correta para compor um "critério
novo" sem escrever uma classe do zero — combina critérios já existentes
com pesos próprios (ver `packages/core/ARCHITECTURE.md` §5).

## 6. Limitações conhecidas e documentadas (não bugs silenciosos)

Estas existem porque o Domain (`packages/core`), corretamente, não expõe
certas iterações que só fazem sentido do ponto de vista de persistência
— e esta etapa não alterou o Domain (fora de escopo, ver instrução
original). Cada uma está comentada no código-fonte também:

1. **`Methodology.classification`/`categoryOverrides` não são
   persistidos via introspecção do objeto de Domain.** `Methodology` (Domain)
   só expõe `classify(score)` e `overrideFor(slug)`, não uma lista
   completa. `MethodologyMapper.toDTO()` por isso recebe um parâmetro
   `extras` opcional — os Use Cases que criam/revisam uma metodologia já
   têm essa informação em mãos (veio do `CreateMethodologyCommand`) e a
   repassam explicitamente, então o round-trip funciona corretamente na
   prática; só uma chamada "órfã" de `toDTO()` sem `extras` perderia essa
   informação (comportamento documentado, não escondido).
2. **`SetCriterionStatusUseCase` só aplica `CriterionDeactivationPolicy`
   se o chamador informar quais metodologias checar.** Não existe hoje,
   em nenhum Port, uma consulta "quais metodologias referenciam o
   critério X" (exigiria um índice reverso). O Domain ainda protege o
   caso extremo no momento do cálculo (`NoActiveCriteriaError`) —
   a Policy é uma proteção _antecipada_, não a única linha de defesa.
3. **`actorId` de auditoria é hardcoded como `"system"`** em todos os
   Use Cases de escrita hoje. Não existe ainda um conceito de
   identidade/sessão nesta camada (Presentation, que traria
   autenticação, não existe) — quando existir, os Commands ganham um
   campo `actorId` real.
4. **`CriterionCatalogPort` é a única exceção à regra "Ports nunca falam
   em tipo de Domain".** `loadRegistry(): Promise<CriterionRegistry>` e
   `register(criterion: Criterion)` retornam/recebem tipos de Domain.
   Justificativa: um critério é comportamento (código), não dado — este
   Port é conceitualmente um carregador de plugins, não um repositório
   de registros. Todos os outros 7 Ports (`SupplementRepositoryPort`,
   `MethodologyRepositoryPort`, `IndexResultRepositoryPort`, etc.) falam
   exclusivamente em DTO/Record.
5. **`MethodologyMapper` é exportado no barrel público**, e algumas de
   suas funções (`fromDTO`, `fromCreateCommand`, `classificationFromDTO`)
   retornam `Methodology`/`ClassificationSystem` (tipos de Domain).
   Mappers existem para a travessia DTO⇄Domain _dentro_ desta camada — se
   Infrastructure ou uma futura Presentation importarem `MethodologyMapper`
   diretamente (em vez de um Use Case/Service), tecnicamente recebem um
   tipo de Domain de volta. Isso é aceitável para um adapter de
   Infrastructure (ex: quem implementa `MethodologyRepositoryPort` pode
   legitimamente precisar do Mapper), mas **nunca deveria ser importado
   por Presentation** — só Use Cases e Application Services são a
   fronteira pretendida para esse consumidor. Registrado aqui para que a
   próxima etapa (Infrastructure/Presentation) trate isso como regra de
   uso, já que o compilador não impede.

## 7. Esqueletos deliberados: Import/Export

`ImportDataUseCase` e `ExportDataUseCase` lançam `NotImplementedYetError`
propositalmente. Os Ports (`ImportSourcePort`, `ExportSinkPort`) e os
Commands já existem — a orquestração real depende de decisões de produto
ainda não tomadas (formato de origem da importação em massa, o que
exatamente um export inclui). Implementar agora seria inventar requisito
não pedido; o contrato já está pronto para quando a decisão vier.

## 8. Auditoria de dependências (executada nesta etapa)

Comandos rodados e resultado — reproduzível a qualquer momento:

```bash
# 1. Domain nunca importa Application
grep -rl "application" packages/core/src --include="*.ts"
# → só packages/core/src/index.ts, e só em comentário (confirmado por leitura manual)

# 2. Toda travessia Application→Domain passa por domain-kernel.ts
grep -rl '\.\./core/src\|\.\./\.\./core/src' packages/application/src --include="*.ts" \
  | grep -v "domain-kernel.ts"
# → vazio

# 3. App Next.js (Presentation) ainda não importa nenhum pacote novo
grep -rlE 'packages/core|packages/application' src --include="*.ts" --include="*.tsx"
# → só 2 ocorrências, ambas em comentários de arquitetura pré-existentes (Fase 0), não imports reais

# 4. Nenhuma classe de Domain exportada crua no barrel público da Application
grep -n '^export.*[^a-zA-Z]Methodology[^a-zA-Z]' packages/application/src/index.ts
# → vazio (só nomes compostos legítimos: MethodologyMapper, MethodologyDTO, etc. — ver §6.5 para a exceção real)
```

**Resultado:** a regra de dependência descrita no §2 se sustenta na
prática, não só na intenção — com as exceções explicitamente
documentadas no §6, que são conscientes e justificadas, não lacunas
descobertas por acaso.

## 9. Validação funcional (smoke test)

`packages/application/scripts/smoke.ts` exercita 21 cenários ponta a
ponta usando adapters em memória (`test-support/InMemoryAdapters.ts` —
não é Infrastructure real, existe só para este teste): cadastro de
suplemento com política de slug único, criação de metodologia, avaliação
com cálculo real do Índice, geração e leitura de ranking, comparação,
busca paginada, revisão de metodologia com bump de versão, rejeição de
revisão vazia pela `MethodologyRevisionPolicy`, gerenciamento de pesos,
ativação/desativação de critério, e validação de Application rejeitando
entrada malformada antes de tocar o Domain. Todos os 21 passam.

```bash
npx tsc -p packages/application/tsconfig.json --noEmit   # typecheck
npx eslint packages/application/src                        # lint
npx tsx packages/application/scripts/smoke.ts                # cenário end-to-end
```

## 10. Princípios aplicados

- **Clean Architecture / Ports & Adapters**: dependências sempre apontam
  para dentro (Presentation/Infrastructure → Application → Domain);
  Ports são a fronteira que inverte o controle — a Application declara o
  que precisa, Infrastructure decide como fornecer.
- **SRP**: um Use Case faz uma operação; um Application Service só
  delega; um Mapper só converte; uma Policy só valida regra
  cross-repositório.
- **OCP**: novos Use Cases, Ports ou Policies se somam sem alterar os
  existentes. `UseCaseFactory` é o único lugar que precisa saber que um
  Use Case novo existe.
- **DIP**: `EvaluateSupplementUseCase` depende de
  `SupplementRepositoryPort`/`MethodologyRepositoryPort`/etc.
  (abstrações), nunca de uma implementação concreta — hoje nem existe
  implementação concreta real, só os adapters de teste.
- **Command/Query separation**: toda entrada de Use Case é ou um Command
  (muda estado) ou uma Query (só lê) — nunca os dois papéis no mesmo tipo.
- **Nenhuma entidade de Domain sai da Application** por nenhuma via
  pretendida (DTOs em toda saída de Use Case/Service) — com as duas
  exceções conscientes documentadas no §6 (`CriterionCatalogPort`,
  export do `MethodologyMapper`), ambas justificadas e registradas, não
  descobertas por acidente.

## 11. O que esta camada deliberadamente NÃO faz

- **Não persiste nada de verdade.** Todos os Ports são interfaces; os
  únicos adapters que existem (`test-support/InMemoryAdapters.ts`) são
  para o smoke test, nunca importados por código de produção.
- **Não expõe HTTP, GraphQL ou Server Actions.** Isso é Presentation —
  fora de escopo desta etapa.
- **Não decide autenticação/autorização real.** `actorId` é um
  placeholder (`"system"`) até existir um conceito de identidade.
- **Não conecta ao catálogo do banco (Prisma).** Os Ports descrevem o
  contrato que um futuro repositório Prisma vai implementar — nenhum
  `schema.prisma` foi tocado nesta etapa.
