import type { UseCase } from "../../shared/UseCase";
import type { CreateBrandCommand, UpdateBrandCommand } from "../../commands/CatalogCommands";
import type { BrandDTO } from "../../dto/CatalogDTO";
import type { BrandRepositoryPort, BrandRecord } from "../../ports/CatalogRepositoryPort";
import type { ClockPort, IdGeneratorPort } from "../../ports/SystemPorts";
import type { AuditLogPort } from "../../ports/AuditLogPort";
import { BrandMapper } from "../../mappers/CatalogMapper";
import { CreateBrandValidator, validateOptionalName } from "../../validators/CatalogValidators";
import {
  ValidationFailedError,
  DuplicateSlugError,
  BrandNotFoundError,
} from "../../errors/ApplicationError";

export class CreateBrandUseCase implements UseCase<CreateBrandCommand, BrandDTO> {
  private readonly validator = new CreateBrandValidator();

  constructor(
    private readonly brands: BrandRepositoryPort,
    private readonly clock: ClockPort,
    private readonly idGenerator: IdGeneratorPort,
    private readonly auditLog: AuditLogPort,
  ) {}

  async execute(command: CreateBrandCommand): Promise<BrandDTO> {
    const validation = this.validator.validate(command);
    if (!validation.ok)
      throw new ValidationFailedError(validation.error.map((i) => `${i.field}: ${i.message}`));

    const existing = await this.brands.findBySlug(command.slug);
    if (existing) throw new DuplicateSlugError("marca", command.slug);

    const now = this.clock.now();
    const record: BrandRecord = {
      id: this.idGenerator.next(),
      slug: command.slug,
      name: command.name,
      logoUrl: command.logoUrl,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.brands.save(record);
    await this.auditLog.record({
      actorId: "system",
      action: "brand.created",
      entityType: "brand",
      entityId: record.id,
      metadata: { slug: record.slug },
      occurredAt: now,
    });

    return BrandMapper.toDTO(record);
  }
}

export class UpdateBrandUseCase implements UseCase<UpdateBrandCommand, BrandDTO> {
  constructor(
    private readonly brands: BrandRepositoryPort,
    private readonly clock: ClockPort,
    private readonly auditLog: AuditLogPort,
  ) {}

  async execute(command: UpdateBrandCommand): Promise<BrandDTO> {
    const validation = validateOptionalName(command.name);
    if (!validation.ok)
      throw new ValidationFailedError(validation.error.map((i) => `${i.field}: ${i.message}`));

    const existing = await this.brands.findById(command.id);
    if (!existing) throw new BrandNotFoundError(command.id);

    const now = this.clock.now();
    const updated: BrandRecord = {
      ...existing,
      name: command.name ?? existing.name,
      logoUrl: command.logoUrl ?? existing.logoUrl,
      updatedAt: now,
    };

    await this.brands.save(updated);
    await this.auditLog.record({
      actorId: "system",
      action: "brand.updated",
      entityType: "brand",
      entityId: updated.id,
      metadata: {},
      occurredAt: now,
    });

    return BrandMapper.toDTO(updated);
  }
}

export class SetBrandActiveUseCase implements UseCase<{ id: string; active: boolean }, void> {
  constructor(
    private readonly brands: BrandRepositoryPort,
    private readonly clock: ClockPort,
    private readonly auditLog: AuditLogPort,
  ) {}

  async execute(command: { id: string; active: boolean }): Promise<void> {
    const existing = await this.brands.findById(command.id);
    if (!existing) throw new BrandNotFoundError(command.id);

    await this.brands.setActive(command.id, command.active);
    await this.auditLog.record({
      actorId: "system",
      action: command.active ? "brand.activated" : "brand.deactivated",
      entityType: "brand",
      entityId: command.id,
      metadata: {},
      occurredAt: this.clock.now(),
    });
  }
}

export class GetBrandUseCase implements UseCase<string, BrandDTO> {
  constructor(private readonly brands: BrandRepositoryPort) {}

  async execute(idOrSlug: string): Promise<BrandDTO> {
    const record =
      (await this.brands.findById(idOrSlug)) ?? (await this.brands.findBySlug(idOrSlug));
    if (!record) throw new BrandNotFoundError(idOrSlug);
    return BrandMapper.toDTO(record);
  }
}
