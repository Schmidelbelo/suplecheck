/**
 * Forma tipada da configuração da plataforma. Nenhum outro lugar da
 * Infrastructure lê `process.env` diretamente fora de `ConfigLoader` —
 * isso é o que permite trocar a fonte de configuração (env vars hoje,
 * um serviço de secrets amanhã) sem tocar em quem consome `AppConfig`.
 */
export interface AppConfig {
  readonly nodeEnv: "development" | "production" | "test";
  readonly siteUrl: string;
  readonly database: {
    readonly url: string | undefined;
  };
  readonly cache: {
    readonly provider: "memory" | "redis";
    readonly redisUrl: string | undefined;
  };
  readonly storage: {
    readonly provider: "memory" | "s3" | "r2";
    readonly bucket: string | undefined;
  };
  readonly mail: {
    readonly provider: "null" | "smtp" | "resend";
    readonly fromAddress: string;
    readonly resendApiKey: string | undefined;
    readonly smtp:
      | {
          readonly host: string;
          readonly port: number;
          readonly user: string | undefined;
          readonly password: string | undefined;
        }
      | undefined;
  };
  readonly analytics: {
    readonly googleAnalyticsId: string | undefined;
    readonly microsoftClarityId: string | undefined;
  };
  readonly logging: {
    readonly level: "debug" | "info" | "warn" | "error";
  };
}
