import type { CacheProvider } from "./CacheProvider";
import { ProviderNotImplementedError } from "../../errors/InfrastructureError";

/**
 * Stub — NÃO importa nenhum cliente Redis. Documenta a forma que a
 * implementação real vai assumir (`redisUrl` já é lido por
 * `ConfigLoader`/`AppConfig.cache.redisUrl`) sem adicionar a dependência
 * `ioredis`/`redis` ao `package.json` antes de ser necessário.
 */
export class RedisCacheProviderStub implements CacheProvider {
  constructor(private readonly redisUrl: string) {}

  async get<T>(_key: string): Promise<T | undefined> {
    this.fail();
  }
  async set<T>(_key: string, _value: T, _ttlSeconds?: number): Promise<void> {
    this.fail();
  }
  async delete(_key: string): Promise<void> {
    this.fail();
  }
  async clear(): Promise<void> {
    this.fail();
  }

  private fail(): never {
    throw new ProviderNotImplementedError(`Redis (${this.redisUrl})`);
  }
}
