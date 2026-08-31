import { CriterionKind, CriterionStatus, type Criterion } from "../domain-kernel";
import type { CriterionDTO, CriterionKindDTO, CriterionStatusDTO } from "../dto/CriterionDTO";

const KIND_LABEL: Record<CriterionKind, CriterionKindDTO> = {
  [CriterionKind.SIMPLE]: "SIMPLE",
  [CriterionKind.COMPOSITE]: "COMPOSITE",
};

const STATUS_LABEL: Record<CriterionStatus, CriterionStatusDTO> = {
  [CriterionStatus.ACTIVE]: "ACTIVE",
  [CriterionStatus.DISABLED]: "DISABLED",
  [CriterionStatus.DEPRECATED]: "DEPRECATED",
};

export const CriterionMapper = {
  toDTO(criterion: Criterion, status: CriterionStatus): CriterionDTO {
    return {
      id: criterion.metadata.id.value,
      name: criterion.metadata.name,
      description: criterion.metadata.description,
      kind: KIND_LABEL[criterion.metadata.kind],
      status: STATUS_LABEL[status],
      applicableCategories: criterion.metadata.applicableCategories,
    };
  },
};
