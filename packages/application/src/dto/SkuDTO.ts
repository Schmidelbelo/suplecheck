export type SkuStatusDTO = "ACTIVE" | "DISCONTINUED";

export interface SkuDTO {
  readonly id: string;
  readonly productId: string;
  readonly gtin?: string;
  readonly variantLabel: string;
  readonly servingsPerUnit?: number;
  readonly dosagePerServing?: number;
  readonly status: SkuStatusDTO;
  readonly successorSkuId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
