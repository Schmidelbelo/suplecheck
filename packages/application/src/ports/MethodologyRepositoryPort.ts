import type { MethodologyDTO } from "../dto/MethodologyDTO";

/**
 * Port de persistência de metodologias. Fala em `MethodologyDTO`, não no
 * `Methodology` do Domain — Infrastructure implementa este Port e nunca
 * precisa importar nada de `packages/core`. `MethodologyMapper.fromDTO`/
 * `toDTO` (Application) são o único lugar que atravessa DTO ↔ entidade.
 *
 * `save` sempre recebe uma versão específica — nunca existe um "update"
 * que sobrescreve; nova versão = novo registro (ver `ReviseMethodologyUseCase`).
 */
export interface MethodologyRepositoryPort {
  findById(id: string): Promise<MethodologyDTO | null>;
  /** A versão vigente hoje para uma categoria (pode ser diferente de "a mais recente cadastrada", se um rollback for decidido). */
  findActiveForCategory(categorySlug: string): Promise<MethodologyDTO | null>;
  listVersions(methodologyId: string): Promise<MethodologyDTO[]>;
  save(methodology: MethodologyDTO): Promise<void>;
  /** Marca qual versão é a vigente para uma categoria — decisão operacional separada de "criar uma versão nova". */
  setActiveForCategory(categorySlug: string, methodologyId: string, version: string): Promise<void>;
}
