/**
 * Erros próprios da Infrastructure — nunca um `ApplicationError` (essa é
 * a Application chamando o tiro) nem um erro nativo cru escapando para
 * quem chamou. Um adapter/provider que falhar por configuração ausente
 * ou por uma integração ainda não implementada lança um destes.
 */
export abstract class InfrastructureError extends Error {
  abstract readonly code: string;
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Uma integração real (Prisma, Redis, S3...) foi selecionada, mas a configuração necessária não foi fornecida. */
export class InfrastructureNotConfiguredError extends InfrastructureError {
  readonly code = "INFRASTRUCTURE_NOT_CONFIGURED";
  constructor(provider: string, reason: string) {
    super(`Provedor "${provider}" não está configurado: ${reason}`);
  }
}

/** Um provider/adapter existe só como stub — a integração real ainda não foi escrita. */
export class ProviderNotImplementedError extends InfrastructureError {
  readonly code = "PROVIDER_NOT_IMPLEMENTED";
  constructor(provider: string) {
    super(
      `O provedor "${provider}" é um stub preparatório — a integração real ainda não foi implementada.`,
    );
  }
}

/** Uma operação externa (HTTP, storage, mail...) falhou em tempo de execução. */
export class ExternalOperationError extends InfrastructureError {
  readonly code = "EXTERNAL_OPERATION_FAILED";
  constructor(operation: string, cause: unknown) {
    super(
      `Falha ao executar "${operation}": ${cause instanceof Error ? cause.message : String(cause)}`,
    );
  }
}
