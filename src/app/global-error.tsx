"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Fallback de último nível — só é usado quando o erro acontece dentro
 * do próprio `layout.tsx` raiz (Navbar/Footer/providers), caso em que
 * `error.tsx` normal não roda porque o layout que o renderizaria também
 * quebrou. Por isso não pode depender de nenhum componente do design
 * system: precisa do próprio `<html>`/`<body>`, sem herdar nada.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Algo deu errado</h1>
        <p style={{ color: "#666", maxWidth: "28rem" }}>
          Ocorreu um erro inesperado. Nossa equipe já foi notificada — tente recarregar a página.
        </p>
      </body>
    </html>
  );
}
