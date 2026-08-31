import type { AppConfig } from "./Config";

/**
 * Único lugar que lê `process.env`. Fornece um `Record<string,string|undefined>`
 * (não necessariamente `process.env` — em teste, é um objeto qualquer)
 * para que `ConfigLoader.load` seja uma função pura e testável, sem
 * acoplar a um runtime específico.
 */
export class ConfigLoader {
  static load(source: Record<string, string | undefined> = process.env): AppConfig {
    const nodeEnv = ConfigLoader.parseNodeEnv(source.NODE_ENV);

    return {
      nodeEnv,
      siteUrl: source.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      database: {
        url: source.DATABASE_URL,
      },
      cache: {
        provider: source.CACHE_PROVIDER === "redis" ? "redis" : "memory",
        redisUrl: source.REDIS_URL,
      },
      storage: {
        provider: ConfigLoader.parseStorageProvider(source.STORAGE_PROVIDER),
        bucket: source.STORAGE_BUCKET,
      },
      mail: {
        provider: ConfigLoader.parseMailProvider(source.MAIL_PROVIDER),
        fromAddress: source.MAIL_FROM_ADDRESS ?? "no-reply@suplecheck.com.br",
        resendApiKey: source.RESEND_API_KEY,
        smtp: source.SMTP_HOST
          ? {
              host: source.SMTP_HOST,
              port: Number(source.SMTP_PORT ?? 587),
              user: source.SMTP_USER,
              password: source.SMTP_PASSWORD,
            }
          : undefined,
      },
      analytics: {
        googleAnalyticsId: source.NEXT_PUBLIC_GA_ID,
        microsoftClarityId: source.NEXT_PUBLIC_CLARITY_ID,
      },
      logging: {
        level: ConfigLoader.parseLogLevel(source.LOG_LEVEL),
      },
    };
  }

  private static parseNodeEnv(value: string | undefined): AppConfig["nodeEnv"] {
    return value === "production" || value === "test" ? value : "development";
  }

  private static parseStorageProvider(value: string | undefined): AppConfig["storage"]["provider"] {
    return value === "s3" || value === "r2" ? value : "memory";
  }

  private static parseMailProvider(value: string | undefined): AppConfig["mail"]["provider"] {
    return value === "smtp" || value === "resend" ? value : "null";
  }

  private static parseLogLevel(value: string | undefined): AppConfig["logging"]["level"] {
    return value === "debug" || value === "warn" || value === "error" ? value : "info";
  }
}
