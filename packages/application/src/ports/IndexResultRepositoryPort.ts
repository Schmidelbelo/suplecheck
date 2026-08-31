import type { IndexResultDTO } from "../dto/IndexResultDTO";

/**
 * Fala em `IndexResultDTO`, nunca no `SupleCheckIndexResult` do Domain.
 * Um resultado salvo é um fato histórico imutável — nunca é recarregado
 * para virar um objeto de Domain de novo (o Índice sempre é recalculado
 * do zero via `CalculateIndexUseCase` quando uma nova nota é precisa);
 * por isso não há perda em persistir só a forma "achatada".
 */
export interface IndexResultRepositoryPort {
  save(result: IndexResultDTO): Promise<void>;
  /** O resultado mais recente para o suplemento (independente de metodologia/versão). */
  findLatest(supplementId: string): Promise<IndexResultDTO | null>;
  /** Histórico completo, mais recente primeiro — a base do gráfico de evolução do Índice. */
  listHistory(supplementId: string): Promise<IndexResultDTO[]>;
  /** Últimos resultados de todos os suplementos de uma categoria — insumo de `GenerateRankingUseCase`. */
  listLatestByCategory(categorySlug: string): Promise<IndexResultDTO[]>;
}
