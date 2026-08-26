"use client";

import type { AnalyticsEventName, AnalyticsEventPayload } from "../types/event";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

/**
 * Camada de abstração sobre os provedores de analytics (GA4, Clarity).
 * Componentes nunca chamam `window.gtag` diretamente — sempre passam por
 * `trackEvent`, o que permite trocar/adicionar provedores em um só lugar
 * (ver ARCHITECTURE.md §2).
 */
export function trackEvent(name: AnalyticsEventName, payload: AnalyticsEventPayload = {}) {
  if (typeof window === "undefined") return;

  window.gtag?.("event", name, payload);

  if (process.env.NODE_ENV === "development") {
    console.debug(`[analytics] ${name}`, payload);
  }
}

export function identifyUser(userId: string, traits: AnalyticsEventPayload = {}) {
  if (typeof window === "undefined") return;
  window.gtag?.("set", { user_id: userId, ...traits });
}
