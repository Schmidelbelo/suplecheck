import type { IndexResultDTO, SupplementDTO } from "@application/index";
import type { ProductBadge } from "@core/index";
import type { ProductPresentation } from "./services/productView.service";

export type { ProductPresentation, IndexResultDTO, SupplementDTO, ProductBadge };

export interface RankingViewEntry {
  readonly position: number;
  readonly finalScore: number;
  readonly classificationTier: string;
  readonly product: ProductPresentation;
  /** Score Geral (qualidade + preço/dose/grama) — calculado uma única vez por `calculateOverallScores`, nunca recomputado no cliente. */
  readonly overallScore: number;
  /** Selos automáticos deste produto dentro do ranking atual (ver `assignProductBadges`). */
  readonly badges: readonly ProductBadge[];
  /** `criterionId` → nota (0–100) do breakdown mais recente — mesmo dado usado para calcular os selos, exposto para a tela de comparação. */
  readonly criteriaScores: Readonly<Record<string, number>>;
}

export interface RankingView {
  readonly categorySlug: string;
  readonly methodologyId: string;
  readonly methodologyVersion: string;
  readonly generatedAt: string;
  readonly entries: readonly RankingViewEntry[];
}

/** Onde este produto está no ranking vigente da sua categoria — `null` quando ainda não há ranking gerado. */
export interface ProductRankingContext {
  readonly position: number;
  readonly total: number;
  readonly categorySlug: string;
  readonly generatedAt: string;
}

export interface ProductView {
  readonly product: SupplementDTO;
  readonly presentation: ProductPresentation | null;
  readonly score: IndexResultDTO | null;
  readonly history: readonly IndexResultDTO[];
  readonly ranking: ProductRankingContext | null;
}
