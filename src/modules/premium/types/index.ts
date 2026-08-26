import type { PlanType } from "@prisma/client";

/** Módulo `premium` (Fase 6). Gating de features por plano. */
export interface Entitlements {
  plan: PlanType;
  canAccessPriceHistory: boolean;
  canCreateAlerts: boolean;
  maxFavorites: number;
}

export function getEntitlements(plan: PlanType): Entitlements {
  if (plan === "PREMIUM") {
    return { plan, canAccessPriceHistory: true, canCreateAlerts: true, maxFavorites: Infinity };
  }
  return { plan, canAccessPriceHistory: false, canCreateAlerts: false, maxFavorites: 5 };
}
