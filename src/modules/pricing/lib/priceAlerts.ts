"use client";

import { useLocalStorageList } from "@/hooks/useLocalStorageList";

const ALERTS_STORAGE_KEY = "suplecheck:price-alerts";
const ALERTS_MAX_ITEMS = 50;

export type PriceAlertType = "below" | "lowest";

export interface PriceAlert {
  readonly productId: string;
  readonly slug: string;
  readonly productName: string;
  readonly type: PriceAlertType;
  /** Só usado quando `type === "below"`. */
  readonly targetCents: number | null;
  readonly createdAt: number;
  /**
   * Reservado para integração futura com e-mail — hoje sempre `null` e
   * nunca lido por nada. Sem backend de envio, gravar um e-mail aqui
   * sem realmente notificar seria uma promessa falsa ao usuário; por
   * isso a UI atual não pede e-mail, só prepara o campo no modelo de
   * dados para não exigir migração quando essa integração existir.
   */
  readonly email: string | null;
}

/** Um alerta por produto — criar de novo com o mesmo `productId` substitui o anterior. */
export function usePriceAlerts() {
  const list = useLocalStorageList<PriceAlert>(ALERTS_STORAGE_KEY, {
    maxItems: ALERTS_MAX_ITEMS,
    keyOf: (item) => item.productId,
  });

  return { ...list, remove: (productId: string) => list.remove(productId) };
}

/** Verifica se a condição do alerta já foi atingida pelo preço atual — cálculo puro, sem efeito colateral (nunca dispara notificação sozinho). */
export function isAlertTriggered(
  alert: PriceAlert,
  currentCents: number,
  minCents: number,
): boolean {
  if (alert.type === "lowest") return currentCents <= minCents;
  if (alert.targetCents == null) return false;
  return currentCents <= alert.targetCents;
}
