import type { UseCase } from "../../shared/UseCase";
import type { SupplementDTO } from "../../dto/SupplementDTO";
import type { SupplementRepositoryPort } from "../../ports/SupplementRepositoryPort";
import { SupplementMapper } from "../../mappers/SupplementMapper";
import { SupplementNotFoundError } from "../../errors/ApplicationError";

export class GetSupplementUseCase implements UseCase<string, SupplementDTO> {
  constructor(private readonly supplements: SupplementRepositoryPort) {}

  async execute(idOrSlug: string): Promise<SupplementDTO> {
    const record =
      (await this.supplements.findById(idOrSlug)) ?? (await this.supplements.findBySlug(idOrSlug));
    if (!record) throw new SupplementNotFoundError(idOrSlug);
    return SupplementMapper.toDTO(record);
  }
}
