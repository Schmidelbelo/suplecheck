import { MarketplaceProviderStubBase } from "./MarketplaceProviderStubBase";

/** Stub — futura integração via API pública do Mercado Livre (busca de itens por termo/GTIN). */
export class MercadoLivreMarketplaceProviderStub extends MarketplaceProviderStubBase {
  readonly marketplaceName = "Mercado Livre";
}
