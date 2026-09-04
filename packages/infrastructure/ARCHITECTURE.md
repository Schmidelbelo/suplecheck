# SupleScore Infrastructure Layer — Arquitetura

> Este documento descreve `packages/infrastructure`, a camada que
> implementa os Ports declarados pela Application Layer
> (`packages/application`). Ver
> [`../application/ARCHITECTURE.md`](../application/ARCHITECTURE.md) e
> [`../core/ARCHITECTURE.md`](../core/ARCHITECTURE.md) para as camadas
> internas, e [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) para a
> plataforma como um todo.

## 1. Por que esta camada existe

A Application Layer declarou 10 Ports (interfaces) — "eu preciso
persistir um suplemento", "eu preciso de um relógio", "eu preciso saber
quais critérios existem" — sem nunca dizer _como_. A Infrastructure
Layer é quem responde a essa pergunta: hoje, com adapters in-memory e
Null Objects reais e funcionais; amanhã, com Prisma, Redis, S3 ou
qualquer integração externa — **sem que Application ou Domain percebam
a troca**.

Esta etapa monta a estrutura completa e todos os adapters possíveis com
os dados disponíveis hoje (nenhum banco real, nenhuma credencial de
serviço externo) — o próximo passo natural (fora do escopo desta etapa)
é conectar o Prisma de verdade nos lugares já marcados.

## 2. As quatro camadas — papel da Infrastructure

```
Presentation   (futuro)
     │  depende de
     ▼
Application    (packages/application — Use Cases, Ports, DTOs)
     ▲  implementado por
     │
Infrastructure (este pacote — Repositories, Adapters, Providers)
```

Infrastructure **depende de** Application (importa seus Ports/DTOs para
implementá-los) e, em regra, não é conhecida por ela — Application
nunca importa nada de `packages/infrastructure`. A seta de dependência
de código (`import`) e a seta de "quem sabe da existência de quem" andam
juntas aqui: Infrastructure sabe que Application existe (precisa, para
implementar os Ports); Application não sabe que Infrastructure existe.

## 3. Estrutura e onde cada Port é implementado

```
packages/infrastructure/src/
├── application-kernel.ts   Único ponto de import de packages/application
├── core-kernel.ts            Único ponto de import de packages/core (exceção documentada, §6)
├── errors/                     InfrastructureError e subclasses
├── config/                      ConfigLoader, EnvironmentManager, AppConfig
├── logging/                      Logger, ConsoleLogger (real), NullLogger
├── telemetry/                     TelemetryProvider, NoopTelemetryProvider
├── monitoring/                     HealthCheckRegistry, HealthIndicator, MemoryIndicator (real)
├── persistence/
│   ├── inmemory/                    InMemoryDatabase (o "banco" compartilhado pelos repositórios)
│   └── prisma/                       PrismaConnectionPlaceholder (NÃO conecta)
├── repositories/                      Implementam os 5 Ports de persistência da Application
├── adapters/                           Implementam os demais Ports (critérios, auditoria, analytics, clock, id, import/export)
├── providers/                           Cache, Storage, Mail, HTTP, Queue, Scheduler, Security — NÃO são Ports da Application, ver §5
├── external-apis/                        Marketplace (Amazon/ML/Shopee/Magalu) e Analytics externo (GA/Clarity) — todos stub
├── transactions/                          TransactionManager
└── bootstrap/                              InfrastructureContainer — o composition root
```

| Port (Application)          | Implementação real hoje                                                    | Implementação futura (stub existente)            |
| --------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------ |
| `SupplementRepositoryPort`  | `InMemorySupplementRepository`                                             | `PrismaSupplementRepositoryStub`                 |
| `CategoryRepositoryPort`    | `InMemoryCategoryRepository`                                               | `PrismaCategoryRepositoryStub`                   |
| `BrandRepositoryPort`       | `InMemoryBrandRepository`                                                  | `PrismaBrandRepositoryStub`                      |
| `MethodologyRepositoryPort` | `InMemoryMethodologyRepository`                                            | `PrismaMethodologyRepositoryStub`                |
| `CriterionCatalogPort`      | `CriterionCatalogAdapter` (carrega critérios embutidos do Domain — ver §6) | —                                                |
| `IndexResultRepositoryPort` | `InMemoryIndexResultRepository`                                            | `PrismaIndexResultRepositoryStub`                |
| `RankingRepositoryPort`     | `InMemoryRankingRepository`                                                | `PrismaRankingRepositoryStub`                    |
| `AuditLogPort`              | `InMemoryAuditLogAdapter` (alternativa: `ConsoleAuditLogAdapter`)          | —                                                |
| `AnalyticsPort`             | `InternalAnalyticsAdapter` (loga via `Logger`)                             | —                                                |
| `ClockPort`                 | `SystemClockAdapter`                                                       | —                                                |
| `IdGeneratorPort`           | `RandomUuidAdapter` (`node:crypto` `randomUUID`)                           | —                                                |
| `ImportSourcePort`          | `InMemoryImportSourceAdapter`                                              | —                                                |
| `ExportSinkPort`            | `NullExportSinkAdapter`                                                    | S3/R2 quando `StorageProvider` estiver conectado |

Todos os 13 Ports da Application têm pelo menos uma implementação real
nesta etapa — nenhum fica sem adapter algum.

## 4. `InfrastructureContainer` — o composition root

`bootstrap/InfrastructureContainer.ts` é o único lugar de toda a
plataforma que decide qual implementação concreta cada abstração recebe
(`buildInfrastructureContainer(envSource)`). Ele:

1. Carrega `AppConfig` via `ConfigLoader`.
2. Monta os adapters de cada um dos 10 Ports empacotados em
   `ApplicationPorts` (in-memory hoje, sempre — mesmo que `DATABASE_URL`
   esteja definida, o Prisma não é escolhido automaticamente: conectar de
   fato é uma decisão explícita de uma etapa futura, não um efeito
   colateral de uma env var presente).
3. Chama `UseCaseFactory.create(ports)` (Application) para obter todos
   os Use Cases já ligados.
4. Escolhe os `providers/` (cache, storage, mail) com base em
   `AppConfig` — cai no adapter in-memory/null sempre que a configuração
   necessária para a integração real não existir.
5. Devolve um único objeto (`InfrastructureContainer`) com tudo pronto
   para uso — uma futura Presentation chamaria só
   `buildInfrastructureContainer().useCases.registerSupplement.execute(...)`.

Trocar um adapter (ex: `InMemorySupplementRepository` →
`PrismaSupplementRepositoryStub` implementado de verdade) é uma mudança
**contida neste arquivo único** — nenhum Use Case, Port, Mapper ou
Policy muda.

## 5. Providers vs. Ports — uma distinção deliberada

`providers/` (Cache, Storage, Mail, HTTP, Queue, Scheduler, Security) e
`external-apis/` (Marketplace, Analytics externo) **não são
implementações de Ports da Application** — são abstrações que vivem
inteiramente dentro da Infrastructure, hoje sem nenhum Use Case as
consumindo. Por quê construí-las mesmo assim, se "nenhum Use Case
conhece Prisma/banco/API externa" já estava garantido pelos Ports
existentes?

Porque a tarefa pediu a estrutura completa da Infrastructure — cache,
storage, mail, fila etc. são responsabilidades legítimas desta camada
independente de já existir ou não um Use Case que os consuma hoje. Cada
um é uma interface própria (`CacheProvider`, `StorageProvider`, ...)
com pelo menos um adapter real (in-memory/null) e, quando fizer sentido
de produto, um Port novo na Application (ex: um futuro
`ExportDataUseCase` completo provavelmente vai depender de
`StorageProvider` através de um novo Port, não diretamente) vai expô-los
para os Use Cases — sem precisar reescrever os providers em si.

## 6. Exceção documentada: `core-kernel.ts`

Todo o resto da Infrastructure só importa `packages/application`
(através de `application-kernel.ts`). A única exceção é
`adapters/CriterionCatalogAdapter.ts`, que importa `packages/core`
diretamente (através de `core-kernel.ts`) para carregar
`builtInCriteria()` — a mesma exceção já documentada em
`packages/application/ARCHITECTURE.md` §6.4 (`CriterionCatalogPort`
lida com comportamento/código, não dado; alguém precisa literalmente
`import` a classe `Criterion`). A Infrastructure é o lugar natural para
essa composição (é quem monta o `CriterionRegistry` de verdade, com
critérios embutidos + quaisquer outros que uma equipe registrar), nunca
a Application em si.

Verificado nesta etapa (ver §7): `core-kernel.ts` é importado por
exatamente um arquivo.

## 7. Auditoria de dependências (executada nesta etapa)

```bash
# 1. Domain nunca conhece Infrastructure
grep -rl "infrastructure" packages/core/src --include="*.ts"
# → vazio

# 2. Application nunca conhece Infrastructure
grep -rl "infrastructure" packages/application/src --include="*.ts"
# → vazio

# 3. Toda travessia Infrastructure→Application passa por application-kernel.ts
grep -rl '\.\./application/src\|\.\./\.\./application/src' packages/infrastructure/src --include="*.ts" \
  | grep -v "application-kernel.ts"
# → vazio

# 4. Toda travessia Infrastructure→Core passa por core-kernel.ts
grep -rl '\.\./core/src\|\.\./\.\./core/src' packages/infrastructure/src --include="*.ts" \
  | grep -v "core-kernel.ts"
# → vazio

# 5. core-kernel.ts é usado só pela exceção documentada
grep -rl "core-kernel" packages/infrastructure/src --include="*.ts"
# → só adapters/CriterionCatalogAdapter.ts

# 6. App Next.js (Presentation) ainda não importa Infrastructure
grep -rlE 'packages/infrastructure' src --include="*.ts" --include="*.tsx"
# → vazio (desconexão deliberada desta etapa)
```

**Resultado:** todas as quatro regras pedidas se sustentam na prática:
Domain não conhece Infrastructure; Application não conhece
implementações concretas; Infrastructure depende só dos Ports (mais a
única exceção documentada e verificada); nenhuma implementação concreta
vaza — `InMemorySupplementRepository`, `ConsoleLogger`,
`InMemoryCacheProvider` etc. só existem dentro deste pacote e só são
instanciados dentro de `bootstrap/InfrastructureContainer.ts`.

## 8. Validação funcional (smoke test)

`packages/infrastructure/scripts/smoke.ts` usa
`buildInfrastructureContainer()` de verdade (não um double de teste — é
a composição real que uma Presentation usaria) e exercita 22 cenários:
cadastro + avaliação de suplemento ponta a ponta usando os repositórios
in-memory reais, health check agregando o `MemoryIndicator`, cache com
TTL, storage (upload/download), fila (enqueue/dequeue), hash de senha
real (`scrypt`) com verificação correta e incorreta, e — igualmente
importante — confirmação de que **todo stub de integração futura
(Redis, S3, Amazon) falha de forma explícita e identificável**
(`ProviderNotImplementedError`/`InfrastructureNotConfiguredError`),
nunca silenciosamente "funciona sem fazer nada". Prisma não é mais um
desses stubs — é a persistência real (PostgreSQL/Neon) desde a migração
descrita em `docs/DEPLOY.md`.

```bash
npx tsc -p packages/infrastructure/tsconfig.json --noEmit   # typecheck
npx eslint packages/infrastructure/src                        # lint
npx tsx packages/infrastructure/scripts/smoke.ts                # cenário end-to-end
```

## 9. Integrações preparadas e seu estado real

| Integração                     | Interface pronta                                 | Estado                                                                                                                                           |
| ------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| PostgreSQL via Prisma          | `PersistenceProvider`, repositórios Prisma reais | Real — conectado a produção/desenvolvimento (Neon), ver `docs/DEPLOY.md`                                                                         |
| Firestore                      | —                                                | Não modelado nesta etapa (Ports atuais assumem um repositório relacional/documento genérico; um adapter Firestore implementaria os mesmos Ports) |
| Redis                          | `CacheProvider`                                  | Stub (`RedisCacheProviderStub`)                                                                                                                  |
| AWS S3                         | `StorageProvider`                                | Stub (`S3StorageProviderStub`)                                                                                                                   |
| Cloudflare R2                  | `StorageProvider`                                | Stub (`R2StorageProviderStub`)                                                                                                                   |
| SMTP                           | `MailProvider`                                   | Stub (`SmtpMailProviderStub`)                                                                                                                    |
| Resend                         | `MailProvider`                                   | Stub (`ResendMailProviderStub`)                                                                                                                  |
| Amazon                         | `MarketplacePriceProvider`                       | Stub                                                                                                                                             |
| Mercado Livre                  | `MarketplacePriceProvider`                       | Stub                                                                                                                                             |
| Shopee                         | `MarketplacePriceProvider`                       | Stub                                                                                                                                             |
| Magalu                         | `MarketplacePriceProvider`                       | Stub                                                                                                                                             |
| Google Analytics (server-side) | `ExternalAnalyticsProvider`                      | Stub                                                                                                                                             |
| Microsoft Clarity              | `ExternalAnalyticsProvider`                      | Stub — documentado como permanentemente client-only (Clarity não tem API de envio server-side)                                                   |

Todo "Stub" acima: interface definida, adapter existe, `throw
ProviderNotImplementedError` explícito — nunca um método vazio que
finge sucesso.

## 10. Princípios aplicados

- **Dependency Inversion**: Application define os Ports; Infrastructure
  os implementa. A direção de dependência de código é o oposto da
  direção de controle — Application manda, Infrastructure obedece, mas
  Infrastructure é quem importa Application, não o contrário.
- **Adapter Pattern**: cada `InMemoryXRepository`/`Prisma*Stub` é um
  adapter — mesma interface, implementação plugável.
- **Null Object Pattern**: `NullLogger`, `NullMailProvider`,
  `NullSchedulerProvider`, `NullExportSinkAdapter`, `NoopTelemetryProvider`
  — comportamento seguro por padrão quando nenhuma integração real está
  configurada, nunca `undefined`/`null` checks espalhados por quem
  consome.
- **Composition Root**: um único lugar (`InfrastructureContainer`)
  decide a fiação completa — nenhum `new InMemoryXRepository()` acontece
  fora dele (exceto no smoke test, que deliberadamente instancia stubs
  isolados para provar que eles falham do jeito certo).
- **Fail loud, not silent**: todo stub lança um erro nomeado e
  descritivo em vez de devolver um valor vazio/default — a diferença
  entre "não implementado ainda" (visível, rastreável) e "parece
  funcionar mas não funciona" (o pior tipo de bug).

## 11. O que esta camada deliberadamente NÃO faz

- **Não conecta Prisma.** `PrismaConnectionPlaceholder` não importa
  `@prisma/client`; os 6 `Prisma*RepositoryStub` lançam ao serem usados.
- **Não conecta nenhum serviço externo real** (Redis, S3, SMTP, Resend,
  marketplaces, GA server-side) — todos são stubs que documentam a forma
  esperada.
- **Não é escolhida automaticamente com base em `DATABASE_URL` estar
  definida.** Mesmo com a env var presente, `InfrastructureContainer`
  usa os adapters in-memory até uma decisão explícita de conectar
  Prisma de verdade (etapa futura).
- **Não expõe HTTP, rotas ou Server Actions.** Isso é Presentation —
  fora de escopo desta etapa; nenhum arquivo em `src/` (o app Next.js)
  foi alterado.
