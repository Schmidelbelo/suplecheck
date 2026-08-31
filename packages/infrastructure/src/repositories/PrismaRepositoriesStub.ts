/**
 * Stubs que provam que os Ports da Application são implementáveis por um
 * repositório Prisma sem qualquer mudança de assinatura — mas NÃO
 * conectam nada: todo método lança `ProviderNotImplementedError`. Nunca
 * instanciados pelo `InfrastructureContainer` hoje (ver bootstrap/); só
 * existem para documentar a forma exata que a implementação real vai
 * assumir na próxima etapa (import de `@prisma/client`, mapeamento de
 * `PrismaClient.product` para `SupplementRecord`, etc.).
 */
import type {
  SupplementRepositoryPort,
  SupplementRecord,
  SupplementSearchCriteria,
  CategoryRepositoryPort,
  BrandRepositoryPort,
  CategoryRecord,
  BrandRecord,
  MethodologyRepositoryPort,
  MethodologyDTO,
  IndexResultRepositoryPort,
  IndexResultDTO,
  RankingRepositoryPort,
  RankingDTO,
  PageRequest,
  PageResult,
} from "../application-kernel";
import { ProviderNotImplementedError } from "../errors/InfrastructureError";

function notImplemented(): never {
  throw new ProviderNotImplementedError("Prisma");
}

export class PrismaSupplementRepositoryStub implements SupplementRepositoryPort {
  async findById(_id: string): Promise<SupplementRecord | null> {
    notImplemented();
  }
  async findBySlug(_slug: string): Promise<SupplementRecord | null> {
    notImplemented();
  }
  async findManyByIds(_ids: readonly string[]): Promise<SupplementRecord[]> {
    notImplemented();
  }
  async search(
    _criteria: SupplementSearchCriteria,
    _page: PageRequest,
  ): Promise<PageResult<SupplementRecord>> {
    notImplemented();
  }
  async save(_record: SupplementRecord): Promise<void> {
    notImplemented();
  }
}

export class PrismaCategoryRepositoryStub implements CategoryRepositoryPort {
  async listAll(): Promise<CategoryRecord[]> {
    notImplemented();
  }
  async findBySlug(_slug: string): Promise<CategoryRecord | null> {
    notImplemented();
  }
}

export class PrismaBrandRepositoryStub implements BrandRepositoryPort {
  async listAll(): Promise<BrandRecord[]> {
    notImplemented();
  }
  async findBySlug(_slug: string): Promise<BrandRecord | null> {
    notImplemented();
  }
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
