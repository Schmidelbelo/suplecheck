/**
 * O quanto confiamos no dado usado por um critério. Um critério pode
 * calcular uma nota mesmo com evidência fraca (ex: reputação com poucas
 * avaliações) — a qualidade da evidência não altera a nota, mas é
 * reportada como observação técnica para quem lê o resultado.
 */
export enum EvidenceQuality {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
  UNVERIFIED = "UNVERIFIED",
}

export enum ValidationSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  CRITICAL = "CRITICAL",
}

/** Ciclo de vida de um critério dentro do registro — controla se ele participa do cálculo. */
export enum CriterionStatus {
  ACTIVE = "ACTIVE",
  DISABLED = "DISABLED",
  DEPRECATED = "DEPRECATED",
}

export enum CriterionKind {
  SIMPLE = "SIMPLE",
  COMPOSITE = "COMPOSITE",
}
