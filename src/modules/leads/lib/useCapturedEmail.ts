"use client";

import * as React from "react";

const STORAGE_KEY = "suplescore:captured-email";

/**
 * Lembra, só neste navegador, que o visitante já deu o e-mail em algum
 * formulário (`LeadCaptureForm`) — não é uma sessão de usuário, é só
 * para não pedir de novo o que ele já deu. O dado real (o `Lead` em si)
 * já foi persistido no servidor via `/api/leads`; isto aqui é puramente
 * uma conveniência de UI, igual aos demais dados locais da plataforma
 * (favoritos, histórico) — nunca a fonte da verdade.
 */
export function useCapturedEmail() {
  const [email, setEmailState] = React.useState<string | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setEmailState(stored);
    } catch {
      // localStorage indisponível — segue sem lembrar nada, sem quebrar a página.
    }
    setHydrated(true);
  }, []);

  const setEmail = React.useCallback((value: string) => {
    setEmailState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Sessão atual continua funcionando só em memória.
    }
  }, []);

  return { email, hydrated, setEmail };
}
