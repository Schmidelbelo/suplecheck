"use client";

import * as React from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/hooks/useToast";
import { formatCurrencyBRL } from "@/lib/utils/format";
import { usePriceAlerts, isAlertTriggered, type PriceAlertType } from "../lib/priceAlerts";

export function PriceAlertForm({
  productId,
  slug,
  productName,
  currentCents,
  minCents,
}: {
  productId: string;
  slug: string;
  productName: string;
  currentCents: number;
  minCents: number;
}) {
  const { items, hydrated, push, remove } = usePriceAlerts();
  const [targetInput, setTargetInput] = React.useState("");

  const existing = items.find((a) => a.productId === productId) ?? null;

  if (!hydrated) return null;

  if (existing) {
    const triggered = isAlertTriggered(existing, currentCents, minCents);
    return (
      <div className="border-border flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          {triggered ? (
            <BellRing className="text-success size-5" aria-hidden />
          ) : (
            <Bell className="text-brand size-5" aria-hidden />
          )}
          <div>
            <p className="text-text text-sm font-medium">
              {triggered
                ? "Condição atingida! O preço já está no valor que você queria."
                : existing.type === "lowest"
                  ? "Avisando quando atingir o menor preço já registrado."
                  : `Avisando quando o preço cair abaixo de ${formatCurrencyBRL(existing.targetCents ?? 0)}.`}
            </p>
            <p className="text-text-subtle text-xs">
              Alerta salvo neste navegador — verificado toda vez que você visita esta página.
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => remove(productId)} className="gap-1.5">
          <BellOff className="size-4" aria-hidden />
          Remover alerta
        </Button>
      </div>
    );
  }

  function createAlert(type: PriceAlertType) {
    const targetCents =
      type === "below" ? Math.round(parseFloat(targetInput.replace(",", ".")) * 100) : null;

    if (type === "below" && (!targetCents || targetCents <= 0)) {
      toast({ variant: "danger", title: "Informe um preço alvo válido" });
      return;
    }

    push({
      productId,
      slug,
      productName,
      type,
      targetCents,
      createdAt: Date.now(),
      email: null,
    });
    toast({ variant: "success", title: "Alerta de preço criado" });
  }

  return (
    <div className="border-border flex flex-col gap-3 rounded-lg border p-4">
      <p className="text-text flex items-center gap-2 text-sm font-medium">
        <Bell className="size-4" aria-hidden />
        Avisar sobre o preço deste produto
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="text"
          inputMode="decimal"
          placeholder="Ex.: 39,90"
          value={targetInput}
          onChange={(e) => setTargetInput(e.target.value)}
          className="w-32"
          aria-label="Preço alvo em reais"
        />
        <Button size="sm" variant="outline" onClick={() => createAlert("below")}>
          Avisar quando baixar deste valor
        </Button>
        <Button size="sm" variant="outline" onClick={() => createAlert("lowest")}>
          Avisar no menor preço já visto
        </Button>
      </div>
      <p className="text-text-subtle text-xs">
        Sem cadastro — o alerta fica salvo só neste navegador e é conferido quando você visita esta
        página ou a área &ldquo;Minha área&rdquo;.
      </p>
    </div>
  );
}
