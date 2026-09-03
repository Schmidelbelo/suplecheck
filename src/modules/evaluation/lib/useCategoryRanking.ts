"use client";

import * as React from "react";
import type { RankingView } from "../types";

/**
 * Busca o ranking de creatina no cliente — usado pelas páginas de dados
 * locais do usuário (`/favoritos`, `/minha-area`), que não podem ser
 * Server Components (dependem de `localStorage`). Preferir sempre dados
 * frescos do ranking em vez de qualquer coisa gravada localmente, para
 * nunca mostrar nota/preço desatualizado.
 */
export function useCategoryRanking(categorySlug = "creatina") {
  const [ranking, setRanking] = React.useState<RankingView | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    fetch(`/api/evaluation/rankings/${categorySlug}/view`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: RankingView | null) => {
        if (!cancelled) setRanking(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categorySlug]);

  return { ranking, loading, error };
}
