import type { UseCase } from "../../shared/UseCase";
import type {
  CreateSkuCommand,
  UpdateSkuCommand,
  SetSkuStatusCommand,
} from "../../commands/SkuCommands";
import type { SkuDTO } from "../../dto/SkuDTO";
import type { SkuRepositoryPort, SkuRecord } from "../../ports/SkuRepositoryPort";
import type { SupplementRepositoryPort } from "../../ports/SupplementRepositoryPort";
import type { ClockPort, IdGeneratorPort } from "../../ports/SystemPorts";
import type { AuditLogPort } from "../../ports/AuditLogPort";
import { SkuMapper } from "../../mappers/SkuMapper";
import { CreateSkuValidator } from "../../validators/SkuValidators";
import {
  ValidationFailedError,
  SupplementNotFoundError,
  SkuNotFoundError,
  DuplicateSkuGtinError,
} from "../../errors/ApplicationError";

export class CreateSkuUseCase implements UseCase<CreateSkuCommand, SkuDTO> {
  private readonly validator = new CreateSkuValidator();

  constructor(
    private readonly skus: SkuRepositoryPort,
    private readonly supplements: SupplementRepositoryPort,
    private readonly clock: ClockPort,
    private readonly idGenerator: IdGeneratorPort,
    private readonly auditLog: AuditLogPort,
  ) {}

  async execute(command: CreateSkuCommand): Promise<SkuDTO> {
    const validation = this.validator.validate(command);
    if (!validation.ok)
      throw new ValidationFailedError(validation.error.map((i) => `${i.field}: ${i.message}`));

    const product = await this.supplements.findById(command.productId);
    if (!product) throw new SupplementNotFoundError(command.productId);

    if (command.gtin) {
      const existing = await this.skus.findByGtin(command.gtin);
      if (existing) throw new DuplicateSkuGtinError(command.gtin);
    }

    const now = this.clock.now();
    const record: SkuRecord = {
      id: this.idGenerator.next(),
      productId: command.productId,
      gtin: command.gtin,
      variantLabel: command.variantLabel,
      servingsPerUnit: command.servingsPerUnit,
      dosagePerServing: command.dosagePerServing,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    };

    await this.skus.save(record);
    await this.auditLog.record({
      actorId: "system",
      action: "sku.created",
      entityType: "sku",
      entityId: record.id,
      metadata: { productId: record.productId },
      occurredAt: now,
    });

    return SkuMapper.toDTO(record);
  }
}

export class UpdateSkuUseCase implements UseCase<UpdateSkuCommand, SkuDTO> {
  constructor(
    private readonly skus: SkuRepositoryPort,
    private readonly clock: ClockPort,
    private readonly auditLog: AuditLogPort,
  ) {}

  async execute(command: UpdateSkuCommand): Promise<SkuDTO> {
    const existing = await this.skus.findById(command.id);
    if (!existing) throw new SkuNotFoundError(command.id);

    const now = this.clock.now();
    const updated: SkuRecord = {
      ...existing,
      variantLabel: command.variantLabel ?? existing.variantLabel,
      servingsPerUnit: command.servingsPerUnit ?? existing.servingsPerUnit,
      dosagePerServing: command.dosagePerServing ?? existing.dosagePerServing,
      successorSkuId: command.successorSkuId ?? existing.successorSkuId,
      updatedAt: now,
    };

    await this.skus.save(updated);
    await this.auditLog.record({
      actorId: "system",
      action: "sku.updated",
      entityType: "sku",
      entityId: updated.id,
      metadata: {},
      occurredAt: now,
    });

    return SkuMapper.toDTO(updated);
  }
}

/** Soft delete — transiciona para DISCONTINUED (Data Pipeline §4.3); nunca remove a linha. */
export class SetSkuStatusUseCase implements UseCase<SetSkuStatusCommand, void> {
  constructor(
    private readonly skus: SkuRepositoryPort,
    private readonly clock: ClockPort,
    private readonly auditLog: AuditLogPort,
  ) {}

  async execute(command: SetSkuStatusCommand): Promise<void> {
    const existing = await this.skus.findById(command.id);
    if (!existing) throw new SkuNotFoundError(command.id);

    await this.skus.setStatus(command.id, command.status);
    await this.auditLog.record({
      actorId: "system",
      action: "sku.status_changed",
      entityType: "sku",
      entityId: command.id,
      metadata: { from: existing.status, to: command.status },
      occurredAt: this.clock.now(),
    });
  }
}

export class GetSkuUseCase implements UseCase<string, SkuDTO> {
  constructor(private readonly skus: SkuRepositoryPort) {}

  async execute(id: string): Promise<SkuDTO> {
    const record = await this.skus.findById(id);
    if (!record) throw new SkuNotFoundError(id);
    return SkuMapper.toDTO(record);
  }
}
