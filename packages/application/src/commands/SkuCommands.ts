export interface CreateSkuCommand {
  readonly productId: string;
  readonly gtin?: string;
  readonly variantLabel: string;
  readonly servingsPerUnit?: number;
  readonly dosagePerServing?: number;
}

export interface UpdateSkuCommand {
  readonly id: string;
  readonly variantLabel?: string;
  readonly servingsPerUnit?: number;
  readonly dosagePerServing?: number;
  readonly successorSkuId?: string;
}

export type SkuStatusCommandValue = "ACTIVE" | "DISCONTINUED";

export interface SetSkuStatusCommand {
  readonly id: string;
  readonly status: SkuStatusCommandValue;
}
