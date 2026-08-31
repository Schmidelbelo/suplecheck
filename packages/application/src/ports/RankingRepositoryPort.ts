import type { RankingDTO } from "../dto/RankingDTO";

/**
 * Persiste snapshots de ranking já gerados (`RankingDTO`, não um tipo de
 * Domain — um ranking é um conceito de apresentação/aplicação, o Core
 * Domain não sabe o que é "ranking"). Guardar o snapshot em vez de
 * recalcular a cada leitura é o que permite `GetRankingQuery` ser barata.
 */
export interface RankingRepositoryPort {
  save(ranking: RankingDTO): Promise<void>;
  findLatest(categorySlug: string): Promise<RankingDTO | null>;
}
