import * as Sentry from "@sentry/nextjs";

/** Monitoramento de erros (servidor Node) — mesma configuração/desativação de instrumentation-client.ts. */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
