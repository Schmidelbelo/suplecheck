import type { Criterion } from "../domain-kernel";
import type { ClassificationBandDTO, CategoryOverrideDTO } from "../dto/MethodologyDTO";

export interface CreateMethodologyCriterionInput {
  readonly criterionId: string;
  readonly weight: number;
  readonly enabled?: boolean;
}

export interface CreateMethodologyCommand {
  readonly id: string;
  readonly name: string;
  readonly criteria: readonly CreateMethodologyCriterionInput[];
  readonly classification?: readonly ClassificationBandDTO[];
  readonly categoryOverrides?: readonly CategoryOverrideDTO[];
  readonly normalizeWeights?: boolean;
}

export type MethodologyVersionBump = "major" | "minor" | "patch";

export interface ReviseMethodologyCommand {
  readonly methodologyId: string;
  readonly bump: MethodologyVersionBump;
  readonly criteria?: readonly CreateMethodologyCriterionInput[];
  readonly classification?: readonly ClassificationBandDTO[];
}

/**
 * Só cobre o registro de um critério já implementado em código (uma
 * classe `Criterion` do Domain, produzida por Infrastructure/composição
 * — nunca por um formulário de usuário final). Um critério
 * verdadeiramente novo (com lógica de cálculo nova) sempre exige código;
 * o que este comando registra é a *disponibilidade* dele na plataforma.
 * Ver `RegisterCriterionUseCase` e `packages/application/ARCHITECTURE.md`
 * §5 para o raciocínio completo.
 */
export interface RegisterCriterionCommand {
  readonly criterion: Criterion;
}

export interface SetCriterionStatusCommand {
  readonly criterionId: string;
  readonly status: "ACTIVE" | "DISABLED" | "DEPRECATED";
}

export interface UpdateCriterionWeightsCommand {
  readonly methodologyId: string;
  readonly weights: readonly { readonly criterionId: string; readonly weight: number }[];
  readonly bump?: MethodologyVersionBump;
}
