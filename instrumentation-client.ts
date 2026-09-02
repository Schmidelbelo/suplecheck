import * as Sentry from "@sentry/nextjs";

/**
 * Monitoramento de erros (cliente) — silenciosamente desativado quando
 * `NEXT_PUBLIC_SENTRY_DSN` não está configurada (`Sentry.init` com
 * `dsn: undefined` não envia nada, não lança, não afeta build/dev).
 * Ver .env.example.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  // Sem replay/session-recording nesta fase — reduz custo e superfície
  // de dados de terceiros até haver necessidade real comprovada.
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
