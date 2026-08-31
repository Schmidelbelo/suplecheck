export type CriterionKindDTO = "SIMPLE" | "COMPOSITE";
export type CriterionStatusDTO = "ACTIVE" | "DISABLED" | "DEPRECATED";

export interface CriterionDTO {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly kind: CriterionKindDTO;
  readonly status: CriterionStatusDTO;
  readonly applicableCategories?: readonly string[];
}
