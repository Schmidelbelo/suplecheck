/**
 * Cache genérico de chave/valor com TTL — não é um Port da Application
 * (nenhum Use Case pede cache hoje), é uma abstração de Infrastructure
 * que um futuro Port ou adapter (ex: cachear `GetRankingQuery`) pode
 * consumir sem acoplar a um provedor específico.
 */
export interface CacheProvider {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}
