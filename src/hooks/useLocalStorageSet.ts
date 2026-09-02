"use client";

import * as React from "react";

/**
 * Conjunto de strings persistido em `localStorage` — base de Favoritos e
 * Comparação de produtos, que não têm login de usuário nesta fase
 * (Beta Público): a única forma de "lembrar" a escolha entre visitas é
 * client-side. Nunca lança se `localStorage` estiver indisponível
 * (modo privado, SSR) — degrada para um Set em memória.
 */
export function useLocalStorageSet(storageKey: string) {
  const [values, setValues] = React.useState<Set<string>>(() => new Set());
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setValues(new Set(JSON.parse(raw)));
    } catch {
      // localStorage indisponível (modo privado/bloqueado) — segue com Set vazio.
    }
    setHydrated(true);
  }, [storageKey]);

  const persist = React.useCallback(
    (next: Set<string>) => {
      setValues(next);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        // ignora — a sessão atual continua funcionando só em memória.
      }
    },
    [storageKey],
  );

  const toggle = React.useCallback(
    (id: string) => {
      const next = new Set(values);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      persist(next);
    },
    [values, persist],
  );

  const clear = React.useCallback(() => persist(new Set()), [persist]);

  return { values, hydrated, toggle, clear };
}
