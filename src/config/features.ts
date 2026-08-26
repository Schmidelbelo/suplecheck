/**
 * Feature flags por fase do roadmap (ver ARCHITECTURE.md §1 e §12).
 * Permite que módulos/rotas de fases futuras existam no código antes de
 * irem para produção, sem branches de longa duração.
 */
export const FEATURES = {
  catalog: true,
  leads: true,
  compare: false,
  priceHistory: false,
  userAccounts: false,
  favorites: false,
  alerts: false,
  premium: false,
  adminPanel: false,
  publicApi: false,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURES[flag];
}
