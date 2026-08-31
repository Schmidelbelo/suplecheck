export interface ProductReference {
  readonly gtin?: string;
  readonly searchTerm: string;
}

export interface PriceQuote {
  readonly marketplace: string;
  readonly priceInCents: number;
  readonly url: string;
  readonly capturedAt: Date;
}

/**
 * Contrato comum para qualquer fonte externa de preço de produto —
 * insumo natural de uma futura fonte de `ImportDataUseCase`
 * (Application) ou de `PricingFacts.categoryAveragePricePerDoseInCents`
 * (Domain). Nenhuma implementação real existe ainda; todas abaixo são
 * stubs documentando a forma esperada.
 */
export interface MarketplacePriceProvider {
  readonly marketplaceName: string;
  fetchPrice(reference: ProductReference): Promise<PriceQuote | null>;
}
