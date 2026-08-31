import type {
  MarketplacePriceProvider,
  ProductReference,
  PriceQuote,
} from "./MarketplacePriceProvider";
import { ProviderNotImplementedError } from "../../errors/InfrastructureError";

/** Base compartilhada pelos 4 stubs de marketplace — cada um só declara o próprio nome. */
export abstract class MarketplaceProviderStubBase implements MarketplacePriceProvider {
  abstract readonly marketplaceName: string;

  async fetchPrice(_reference: ProductReference): Promise<PriceQuote | null> {
    throw new ProviderNotImplementedError(this.marketplaceName);
  }
}
