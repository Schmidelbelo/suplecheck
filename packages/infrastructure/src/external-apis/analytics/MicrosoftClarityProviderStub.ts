import type { ExternalAnalyticsProvider } from "./ExternalAnalyticsProvider";
import { ProviderNotImplementedError } from "../../errors/InfrastructureError";

/** Stub — Clarity não tem API server-side de envio de eventos (é puramente client-side); este stub existe só para completar a simetria e documentar essa limitação. */
export class MicrosoftClarityProviderStub implements ExternalAnalyticsProvider {
  readonly providerName = "Microsoft Clarity";

  constructor(private readonly projectId: string) {}

  async trackServerEvent(): Promise<void> {
    throw new ProviderNotImplementedError(
      `${this.providerName} (${this.projectId}) — Clarity não oferece API server-side; eventos só via script client-side.`,
    );
  }
}
