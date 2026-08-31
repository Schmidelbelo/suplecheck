import type { UseCase } from "../../shared/UseCase";
import type { RegisterSupplementCommand } from "../../commands/SupplementCommands";
import type { SupplementDTO } from "../../dto/SupplementDTO";
import type {
  SupplementRepositoryPort,
  SupplementRecord,
} from "../../ports/SupplementRepositoryPort";
import type {
  CategoryRepositoryPort,
  BrandRepositoryPort,
} from "../../ports/CatalogRepositoryPort";
import type { ClockPort, IdGeneratorPort } from "../../ports/SystemPorts";
import type { AuditLogPort } from "../../ports/AuditLogPort";
import { SupplementRegistrationPolicy } from "../../policies/SupplementRegistrationPolicy";
import { SupplementMapper } from "../../mappers/SupplementMapper";
import { RegisterSupplementValidator } from "../../validators/SupplementValidators";
import { ValidationFailedError } from "../../errors/ApplicationError";

export class RegisterSupplementUseCase implements UseCase<
  RegisterSupplementCommand,
  SupplementDTO
> {
  private readonly validator = new RegisterSupplementValidator();

  constructor(
    private readonly supplements: SupplementRepositoryPort,
    private readonly categories: CategoryRepositoryPort,
    private readonly brands: BrandRepositoryPort,
    private readonly clock: ClockPort,
    private readonly idGenerator: IdGeneratorPort,
    private readonly auditLog: AuditLogPort,
  ) {}

  async execute(command: RegisterSupplementCommand): Promise<SupplementDTO> {
    const validation = this.validator.validate(command);
    if (!validation.ok)
      throw new ValidationFailedError(validation.error.map((i) => `${i.field}: ${i.message}`));

    const policy = new SupplementRegistrationPolicy(this.supplements, this.categories, this.brands);
    await policy.assertCanRegister(command);

    const now = this.clock.now();
    const record: SupplementRecord = {
      id: this.idGenerator.next(),
      slug: command.slug,
      name: command.name,
      categorySlug: command.categorySlug,
      brandSlug: command.brandSlug,
      attributes: command.attributes ?? {},
      createdAt: now,
      updatedAt: now,
    };

    await this.supplements.save(record);
    await this.auditLog.record({
      actorId: "system",
      action: "supplement.registered",
      entityType: "supplement",
      entityId: record.id,
      metadata: { slug: record.slug },
      occurredAt: now,
    });

    return SupplementMapper.toDTO(record);
  }
}
