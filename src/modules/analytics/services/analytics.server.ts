import "server-only";
import type { AnalyticsEventName, AnalyticsEventPayload } from "../types/event";

/**
 * Contraparte server-side de `trackEvent` (analytics.service.ts), para
 * eventos disparados a partir de route handlers/server actions (ex:
 * conversão de lead confirmada no backend). Hoje só loga; ponto único de
 * extensão para enviar a uma API de analytics server-to-server (GA
 * Measurement Protocol, PostHog capture, etc.).
 */
export function trackServerEvent(name: AnalyticsEventName, payload: AnalyticsEventPayload = {}) {
  if (process.env.NODE_ENV === "development") {
    console.debug(`[analytics:server] ${name}`, payload);
  }
}
