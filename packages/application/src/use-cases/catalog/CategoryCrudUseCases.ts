import type { UseCase } from "../../shared/UseCase";
import type { CreateCategoryCommand, UpdateCategoryCommand } from "../../commands/CatalogCommands";
import type { CategoryDTO } from "../../dto/CatalogDTO";
import type { CategoryRepositoryPort, CategoryRecord } from "../../ports/CatalogRepositoryPort";
import type { ClockPort, IdGeneratorPort } from "../../ports/SystemPorts";
import type { AuditLogPort } from "../../ports/AuditLogPort";
import { CategoryMapper } from "../../mappers/CatalogMapper";
import { CreateCategoryValidator, validateOptionalName } from "../../validators/CatalogValidators";
import {
  ValidationFailedError,
  DuplicateSlugError,
  CategoryNotFoundError,
} from "../../errors/ApplicationError";

export class CreateCategoryUseCase implements UseCase<CreateCategoryCommand, CategoryDTO> {
  private readonly validator = new CreateCategoryValidator();

  constructor(
    private readonly categories: CategoryRepositoryPort,
    private readonly clock: ClockPort,
    private readonly idGenerator: IdGeneratorPort,
    private readonly auditLog: AuditLogPort,
  ) {}

  async execute(command: CreateCategoryCommand): Promise<CategoryDTO> {
    const validation = this.validator.validate(command);
    if (!validation.ok)
      throw new ValidationFailedError(validation.error.map((i) => `${i.field}: ${i.message}`));

    const existing = await this.categories.findBySlug(command.slug);
    if (existing) throw new DuplicateSlugError("categoria", command.slug);

    const now = this.clock.now();
    const record: CategoryRecord = {
      id: this.idGenerator.next(),
      slug: command.slug,
      name: command.name,
      description: command.description,
      parentSlug: command.parentSlug,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.categories.save(record);
    await this.auditLog.record({
      actorId: "system",
      action: "category.created",
      entityType: "category",
      entityId: record.id,
      metadata: { slug: record.slug },
      occurredAt: now,
    });

    return CategoryMapper.toDTO(record);
  }
}

export class UpdateCategoryUseCase implements UseCase<UpdateCategoryCommand, CategoryDTO> {
  constructor(
    private readonly categories: CategoryRepositoryPort,
    private readonly clock: ClockPort,
    private readonly auditLog: AuditLogPort,
  ) {}

  async execute(command: UpdateCategoryCommand): Promise<CategoryDTO> {
    const validation = validateOptionalName(command.name);
    if (!validation.ok)
      throw new ValidationFailedError(validation.error.map((i) => `${i.field}: ${i.message}`));

    const existing = await this.categories.findById(command.id);
    if (!existing) throw new CategoryNotFoundError(command.id);

    const now = this.clock.now();
    const updated: CategoryRecord = {
      ...existing,
      name: command.name ?? existing.name,
      description: command.description ?? existing.description,
      parentSlug: command.parentSlug ?? existing.parentSlug,
      updatedAt: now,
    };

    await this.categories.save(updated);
    await this.auditLog.record({
      actorId: "system",
      action: "category.updated",
      entityType: "category",
      entityId: updated.id,
      metadata: {},
      occurredAt: now,
    });

    return CategoryMapper.toDTO(updated);
  }
}

export class SetCategoryActiveUseCase implements UseCase<{ id: string; active: boolean }, void> {
  constructor(
    private readonly categories: CategoryRepositoryPort,
    private readonly clock: ClockPort,
    private readonly auditLog: AuditLogPort,
  ) {}

  async execute(command: { id: string; active: boolean }): Promise<void> {
    const existing = await this.categories.findById(command.id);
    if (!existing) throw new CategoryNotFoundError(command.id);

    await this.categories.setActive(command.id, command.active);
    await this.auditLog.record({
      actorId: "system",
      action: command.active ? "category.activated" : "category.deactivated",
      entityType: "category",
      entityId: command.id,
      metadata: {},
      occurredAt: this.clock.now(),
    });
  }
}

export class GetCategoryUseCase implements UseCase<string, CategoryDTO> {
  constructor(private readonly categories: CategoryRepositoryPort) {}

  async execute(idOrSlug: string): Promise<CategoryDTO> {
    const record =
      (await this.categories.findById(idOrSlug)) ?? (await this.categories.findBySlug(idOrSlug));
    if (!record) throw new CategoryNotFoundError(idOrSlug);
    return CategoryMapper.toDTO(record);
  }
}
