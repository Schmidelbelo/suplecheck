import type { UseCase } from "../../shared/UseCase";
import type {
  CreateManufacturerCommand,
  UpdateManufacturerCommand,
} from "../../commands/CatalogCommands";
import type { ManufacturerDTO } from "../../dto/CatalogDTO";
import type {
  ManufacturerRepositoryPort,
  ManufacturerRecord,
} from "../../ports/CatalogRepositoryPort";
import type { ClockPort, IdGeneratorPort } from "../../ports/SystemPorts";
import type { AuditLogPort } from "../../ports/AuditLogPort";
import { ManufacturerMapper } from "../../mappers/CatalogMapper";
import { CreateManufacturerValidator } from "../../validators/CatalogValidators";
import {
  ValidationFailedError,
  DuplicateSlugError,
  ManufacturerNotFoundError,
} from "../../errors/ApplicationError";

export class CreateManufacturerUseCase implements UseCase<
  CreateManufacturerCommand,
  ManufacturerDTO
> {
  private readonly validator = new CreateManufacturerValidator();

  constructor(
    private readonly manufacturers: ManufacturerRepositoryPort,
    private readonly clock: ClockPort,
    private readonly idGenerator: IdGeneratorPort,
    private readonly auditLog: AuditLogPort,
  ) {}

  async execute(command: CreateManufacturerCommand): Promise<ManufacturerDTO> {
    const validation = this.validator.validate(command);
    if (!validation.ok)
      throw new ValidationFailedError(validation.error.map((i) => `${i.field}: ${i.message}`));

    const existing = await this.manufacturers.findBySlug(command.slug);
    if (existing) throw new DuplicateSlugError("fabricante", command.slug);

    const now = this.clock.now();
    const record: ManufacturerRecord = {
      id: this.idGenerator.next(),
      slug: command.slug,
      name: command.name,
      country: command.country,
      certifications: command.certifications ?? [],
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.manufacturers.save(record);
    await this.auditLog.record({
      actorId: "system",
      action: "manufacturer.created",
      entityType: "manufacturer",
      entityId: record.id,
      metadata: { slug: record.slug },
      occurredAt: now,
    });

    return ManufacturerMapper.toDTO(record);
  }
}

export class UpdateManufacturerUseCase implements UseCase<
  UpdateManufacturerCommand,
  ManufacturerDTO
> {
  constructor(
    private readonly manufacturers: ManufacturerRepositoryPort,
    private readonly clock: ClockPort,
    private readonly auditLog: AuditLogPort,
  ) {}

  async execute(command: UpdateManufacturerCommand): Promise<ManufacturerDTO> {
    const existing = await this.manufacturers.findById(command.id);
    if (!existing) throw new ManufacturerNotFoundError(command.id);

    const now = this.clock.now();
    const updated: ManufacturerRecord = {
      ...existing,
      name: command.name ?? existing.name,
      country: command.country ?? existing.country,
      certifications: command.certifications ?? existing.certifications,
      updatedAt: now,
    };

    await this.manufacturers.save(updated);
    await this.auditLog.record({
      actorId: "system",
      action: "manufacturer.updated",
      entityType: "manufacturer",
      entityId: updated.id,
      metadata: {},
      occurredAt: now,
    });

    return ManufacturerMapper.toDTO(updated);
  }
}

export class SetManufacturerActiveUseCase implements UseCase<
  { id: string; active: boolean },
  void
> {
  constructor(
    private readonly manufacturers: ManufacturerRepositoryPort,
    private readonly clock: ClockPort,
    private readonly auditLog: AuditLogPort,
  ) {}

  async execute(command: { id: string; active: boolean }): Promise<void> {
    const existing = await this.manufacturers.findById(command.id);
    if (!existing) throw new ManufacturerNotFoundError(command.id);

    await this.manufacturers.setActive(command.id, command.active);
    await this.auditLog.record({
      actorId: "system",
      action: command.active ? "manufacturer.activated" : "manufacturer.deactivated",
      entityType: "manufacturer",
      entityId: command.id,
      metadata: {},
      occurredAt: this.clock.now(),
    });
  }
}

export class GetManufacturerUseCase implements UseCase<string, ManufacturerDTO> {
  constructor(private readonly manufacturers: ManufacturerRepositoryPort) {}

  async execute(idOrSlug: string): Promise<ManufacturerDTO> {
    const record =
      (await this.manufacturers.findById(idOrSlug)) ??
      (await this.manufacturers.findBySlug(idOrSlug));
    if (!record) throw new ManufacturerNotFoundError(idOrSlug);
    return ManufacturerMapper.toDTO(record);
  }
}
