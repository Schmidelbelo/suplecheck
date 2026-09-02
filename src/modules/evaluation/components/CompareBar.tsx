"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

const MAX_COMPARE = 3;

export { MAX_COMPARE };

export function CompareBar({
  count,
  onCompare,
  onClear,
}: {
  count: number;
  onCompare: () => void;
  onClear: () => void;
}) {
  if (count === 0) return null;

  return (
    <div className="border-border bg-surface-raised fixed inset-x-0 bottom-0 z-(--z-overlay) border-t shadow-lg">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <p className="text-text text-sm font-medium">
          {count} de {MAX_COMPARE} produto{count > 1 ? "s" : ""} selecionado{count > 1 ? "s" : ""}{" "}
          para comparar
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClear} aria-label="Limpar seleção">
            <X className="size-4" />
          </Button>
          <Button size="sm" onClick={onCompare} disabled={count < 2}>
            Comparar
          </Button>
        </div>
      </div>
    </div>
  );
}
