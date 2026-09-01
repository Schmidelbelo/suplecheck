/**
 * Segundo (e único outro) ponto de acoplamento — desta vez com o Core
 * Domain, usado exclusivamente por
 * `repositories/prisma/PrismaCriterionCatalogAdapter.ts`.
 *
 * Por quê Infrastructure importa Domain diretamente, se a regra geral é
 * "Infrastructure só conhece Application"? Porque `CriterionCatalogPort`
 * (Application) é a exceção documentada em
 * `packages/application/ARCHITECTURE.md` §6.4: um critério é
 * comportamento (código), não dado — alguém precisa literalmente
 * `import` a classe `Criterion` para "carregá-la" no registro. Esse
 * "alguém" é a Infrastructure (o lugar natural de compor código de
 * plugins/adapters), nunca a Application em si. Fora deste único
 * arquivo, nenhum outro lugar de `packages/infrastructure` importa
 * `packages/core`.
 */
export * from "../../core/src/index";
