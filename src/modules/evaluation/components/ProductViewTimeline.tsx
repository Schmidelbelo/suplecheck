"use client";

import * as React from "react";
import { History } from "lucide-react";
import { formatRelativeDay } from "@/lib/utils/format";
import { useRecentlyViewed } from "../lib/recentActivity";

/**
 * Grava a visita atual (uma vez por montagem/slug) e mostra "Você
 * visitou este produto: hoje/ontem/há X dias — Nº visualizações" — com
 * base na visita ANTERIOR (capturada antes de `recordVisit` rodar, numa
 * ref), nunca na visita que acabou de acontecer, senão sempre diria
 * "hoje" e nunca ajudaria a lembrar quando foi a última vez de verdade.
 * Sem visita anterior (primeira vez neste produto), não renderiza nada.
 */
export function ProductViewTimeline({ slug }: { slug: string }) {
  const { items, hydrated, recordVisit } = useRecentlyViewed();
  const previousEntryRef = React.useRef<
    { viewedAt: number; visitCount: number } | null | undefined
  >(undefined);
  const recordedRef = React.useRef(false);

  if (hydrated && previousEntryRef.current === undefined) {
    const existing = items.find((item) => item.slug === slug);
    previousEntryRef.current = existing
      ? { viewedAt: existing.viewedAt, visitCount: existing.visitCount }
      : null;
  }

  React.useEffect(() => {
    if (!hydrated || recordedRef.current) return;
    recordedRef.current = true;
    recordVisit(slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, slug]);

  const previous = previousEntryRef.current;
  if (!previous) return null;

  const totalVisitsIncludingNow = previous.visitCount + 1;

  return (
    <p className="text-text-muted flex items-center gap-1.5 text-sm">
      <History className="size-4 shrink-0" aria-hidden />
      Você visitou este produto pela última vez {formatRelativeDay(previous.viewedAt)} — esta é sua{" "}
      {totalVisitsIncludingNow}ª visita aqui.
    </p>
  );
}
