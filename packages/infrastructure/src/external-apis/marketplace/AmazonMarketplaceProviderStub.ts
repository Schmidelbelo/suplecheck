import { MarketplaceProviderStubBase } from "./MarketplaceProviderStubBase";

/** Stub — futura integração via Amazon Product Advertising API (exige credenciais de Associate). */
export class AmazonMarketplaceProviderStub extends MarketplaceProviderStubBase {
  readonly marketplaceName = "Amazon";
}
