/**
 * Catálogo central de eventos de analytics da plataforma. Um evento novo
 * deve ser adicionado aqui antes de ser disparado em qualquer componente —
 * evita strings soltas espalhadas pelo código e mantém o "dicionário de
 * eventos" auditável em um único lugar.
 */
export const ANALYTICS_EVENTS = {
  LEAD_CAPTURED: "lead_captured",
  PRODUCT_VIEWED: "product_viewed",
  PRODUCT_CLICKED: "product_clicked",
  RANKING_VIEWED: "ranking_viewed",
  COMPARISON_STARTED: "comparison_started",
  COMPARISON_ITEM_ADDED: "comparison_item_added",
  FAVORITE_ADDED: "favorite_added",
  FAVORITE_REMOVED: "favorite_removed",
  OUTBOUND_LINK_CLICKED: "outbound_link_clicked",
  NEWSLETTER_SUBSCRIBED: "newsletter_subscribed",
  CONTACT_MESSAGE_SENT: "contact_message_sent",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type AnalyticsEventPayload = Record<string, string | number | boolean | undefined>;
