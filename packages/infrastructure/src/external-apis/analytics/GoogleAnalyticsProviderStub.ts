import type { ExternalAnalyticsProvider } from "./ExternalAnalyticsProvider";
import { ProviderNotImplementedError } from "../../errors/InfrastructureError";

/** Stub — futura integração via Google Analytics Measurement Protocol (envio server-side, complementar ao script client-side já existente). */
export class GoogleAnalyticsProviderStub implements ExternalAnalyticsProvider {
  readonly providerName = "Google Analytics";

  constructor(private readonly measurementId: string) {}

  async trackServerEvent(): Promise<void> {
    throw new ProviderNotImplementedError(`${this.providerName} (${this.measurementId})`);
  }
}
