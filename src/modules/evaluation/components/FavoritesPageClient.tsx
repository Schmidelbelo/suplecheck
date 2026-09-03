"use client";

import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { RankingEntryCard } from "./RankingEntryCard";
import { useFavorites } from "./FavoriteButton";
import { useCategoryRanking } from "../lib/useCategoryRanking";

export function FavoritesPageClient() {
  const { values: favoriteIds, hydrated, clear } = useFavorites();
  const { ranking, loading } = useCategoryRanking();

  const favoriteEntries = (ranking?.entries ?? []).filter((entry) =>
    favoriteIds.has(entry.product.id),
  );

  if (!hydrated || loading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (favoriteEntries.length === 0) {
    return (
      <EmptyState
        icon={<Heart aria-hidden />}
        title="Sua lista de desejos está vazia"
        description="Toque no coração de qualquer produto do ranking para salvá-lo aqui e comparar depois."
        action={
          <Button asChild>
            <Link href="/creatina">Ver ranking de creatina</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-sm">
          {favoriteEntries.length} produto{favoriteEntries.length > 1 ? "s" : ""} salvo
          {favoriteEntries.length > 1 ? "s" : ""}
        </p>
        <Button variant="ghost" size="sm" onClick={clear} className="gap-1.5">
          <Trash2 className="size-4" aria-hidden />
          Limpar lista
        </Button>
      </div>
      <div className="flex flex-col gap-4">
        {favoriteEntries.map((entry) => (
          <RankingEntryCard key={entry.product.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
