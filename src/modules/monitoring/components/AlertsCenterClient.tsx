"use client";

import Link from "next/link";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrencyBRL } from "@/lib/utils/format";
import { usePriceAlerts, isAlertTriggered } from "@/modules/pricing/lib/priceAlerts";
import { useCategoryRanking } from "@/modules/evaluation/lib/useCategoryRanking";

/**
 * Todos os alertas de preço configurados pelo usuário, com a condição e
 * o preço atual real de cada produto (resolvido contra o ranking, nunca
 * um preço congelado). Sem envio de e-mail ainda — o campo já existe no
 * modelo de dados (`PriceAlert.email`), só não é usado por nada.
 */
export function AlertsCenterClient() {
  const { items: alerts, hydrated, remove } = usePriceAlerts();
  const { ranking, loading: rankingLoading } = useCategoryRanking();

  if (!hydrated || rankingLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={<Bell aria-hidden />}
        title="Nenhum alerta configurado"
        description="Abra a página de um produto e defina um preço alvo (ou o menor preço já visto) para monitorá-lo aqui."
        action={
          <Button asChild>
            <Link href="/creatina">Explorar produtos</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-text-muted text-sm">
        {alerts.length} produto{alerts.length === 1 ? "" : "s"} monitorado
        {alerts.length === 1 ? "" : "s"}.
      </p>
      {alerts.map((alert) => {
        const product = ranking?.entries.find((e) => e.product.slug === alert.slug) ?? null;
        const currentCents = product?.product.price?.cents ?? null;
        const triggered =
          currentCents != null ? isAlertTriggered(alert, currentCents, currentCents) : false;

        return (
          <Card key={alert.productId}>
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/creatina/${alert.slug}`}
                  className="text-text font-medium hover:underline"
                >
                  {alert.productName}
                </Link>
                <p className="text-text-muted text-sm">
                  {alert.type === "lowest"
                    ? "Condição: avisar no menor preço já visto"
                    : `Condição: avisar abaixo de ${formatCurrencyBRL(alert.targetCents ?? 0)}`}
                </p>
                <p className="text-text-subtle text-xs">
                  Preço atual:{" "}
                  {currentCents != null ? formatCurrencyBRL(currentCents) : "não disponível"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={triggered ? "success" : "default"}>
                  {triggered ? (
                    <span className="flex items-center gap-1">
                      <BellRing className="size-3.5" aria-hidden />
                      Condição atingida
                    </span>
                  ) : (
                    "Monitorando"
                  )}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(alert.productId)}
                  aria-label={`Remover alerta de ${alert.productName}`}
                >
                  <BellOff className="size-4" aria-hidden />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
