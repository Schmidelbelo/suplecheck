import type { AppConfig } from "./Config";

/**
 * Perguntas sobre "em que ambiente estamos" concentradas em um lugar —
 * evita `config.nodeEnv === "production"` espalhado e divergente pelo
 * resto da Infrastructure.
 */
export class EnvironmentManager {
  constructor(private readonly config: AppConfig) {}

  isProduction(): boolean {
    return this.config.nodeEnv === "production";
  }

  isDevelopment(): boolean {
    return this.config.nodeEnv === "development";
  }

  isTest(): boolean {
    return this.config.nodeEnv === "test";
  }

  /** Uma feature "real" (não in-memory/null) só deve ligar se a config necessária existir — evita metade-configurado silencioso. */
  hasDatabaseConfigured(): boolean {
    return Boolean(this.config.database.url);
  }

  hasRedisConfigured(): boolean {
    return Boolean(this.config.cache.redisUrl);
  }

  hasResendConfigured(): boolean {
    return Boolean(this.config.mail.resendApiKey);
  }
}
