/**
 * Stubs que provam que os Ports ainda não conectados (Methodology,
 * IndexResult, Ranking — fora do escopo desta etapa, ver
 * `docs/domain-model/DOMAIN_MODEL.md`) são implementáveis por um
 * repositório Prisma sem qualquer mudança de assinatura, mas NÃO
 * conectam nada: todo método lança `ProviderNotImplementedError`.
 * Category/Brand/Manufacturer/Supplement/Sku/AuditLog têm implementação
 * REAL agora em `repositories/prisma/` — não são mais stubs.
 */
import type {
  MethodologyRepositoryPort,
  MethodologyDTO,
  IndexResultRepositoryPort,
  IndexResultDTO,
  RankingRepositoryPort,
  RankingDTO,
} from "../application-kernel";
import { ProviderNotImplementedError } from "../errors/InfrastructureError";

function notImplemented(): never {
  throw new ProviderNotImplementedError("Prisma");
}

export class PrismaMethodologyRepositoryStub implements MethodologyRepositoryPort {
  async findById(_id: string): Promise<MethodologyDTO | null> {
    notImplemented();
  }
  async findActiveForCategory(_categorySlug: string): Promise<MethodologyDTO | null> {
    notImplemented();
  }
  async listVersions(_methodologyId: string): Promise<MethodologyDTO[]> {
    notImplemented();
  }
  async save(_methodology: MethodologyDTO): Promise<void> {
    notImplemented();
  }
  async setActiveForCategory(
    _categorySlug: string,
    _methodologyId: string,
    _version: string,
  ): Promise<void> {
    notImplemented();
  }
}

export class PrismaIndexResultRepositoryStub implements IndexResultRepositoryPort {
  async save(_result: IndexResultDTO): Promise<void> {
    notImplemented();
  }
  async findLatest(_supplementId: string): Promise<IndexResultDTO | null> {
    notImplemented();
  }
  async listHistory(_supplementId: string): Promise<IndexResultDTO[]> {
    notImplemented();
  }
  async listLatestByCategory(_categorySlug: string): Promise<IndexResultDTO[]> {
    notImplemented();
  }
}

export class PrismaRankingRepositoryStub implements RankingRepositoryPort {
  async save(_ranking: RankingDTO): Promise<void> {
    notImplemented();
  }
  async findLatest(_categorySlug: string): Promise<RankingDTO | null> {
    notImplemented();
  }
}
