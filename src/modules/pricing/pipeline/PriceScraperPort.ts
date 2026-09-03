/**
 * Contrato do "Scraper" do pipeline — dado um SKU (com a URL da última
 * loja conhecida), devolve o preço capturado agora. Implementação real
 * (HTTP + parser por loja) é uma decisão de negócio/jurídica que não me
 * cabe tomar sozinho — automatizar a captura de páginas de terceiros
 * (Amazon, Mercado Livre etc.) envolve Termos de Serviço, possível
 * necessidade de proxy/anti-bot e um parser por site, tudo fora do
 * escopo de "deixar a arquitetura pronta".
 *
 * Segue o mesmo padrão já usado no projeto para integrações externas
 * ainda não decididas (`RedisCacheProviderStub`, `S3StorageProviderStub`,
 * `AmazonMarketplaceProviderStub` — todos lançam `ProviderNotImplementedError`
 * de forma explícita em vez de fingir que funcionam).
 */
export interface PriceScraperInput {
  readonly skuId: string;
  readonly storeId: string;
  readonly url: string | null;
  /** Último preço conhecido — a implementação-placeholder usa isto para não fabricar dado. */
  readonly lastKnownPriceCents: number;
}

export interface PriceScraperResult {
  readonly priceCents: number;
  readonly availability: "IN_STOCK" | "OUT_OF_STOCK" | "UNKNOWN";
}

export interface PriceScraperPort {
  fetchPrice(input: PriceScraperInput): Promise<PriceScraperResult>;
}

/**
 * Implementação-placeholder: NÃO faz nenhuma requisição HTTP externa —
 * apenas confirma o último preço já conhecido. Isto deixa o pipeline
 * inteiro (validação → normalização → comparação → persistência →
 * atualização do produto) executável e testável de ponta a ponta hoje,
 * sem inventar nenhum preço novo e sem acessar site nenhum de terceiro.
 * Trocar por um scraper real é só implementar `PriceScraperPort` de
 * novo e trocar a instância montada em `PriceCaptureJobRunner`.
 */
export class LastKnownPriceScraperProvider implements PriceScraperPort {
  async fetchPrice(input: PriceScraperInput): Promise<PriceScraperResult> {
    return { priceCents: input.lastKnownPriceCents, availability: "UNKNOWN" };
  }
}
