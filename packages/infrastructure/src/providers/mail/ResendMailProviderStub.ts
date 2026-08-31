import type { MailProvider, MailMessage } from "./MailProvider";
import { ProviderNotImplementedError } from "../../errors/InfrastructureError";

/** Stub — não importa o SDK `resend`. Config já vem pronta em `AppConfig.mail.resendApiKey`. */
export class ResendMailProviderStub implements MailProvider {
  constructor(private readonly apiKey: string) {}

  async send(_message: MailMessage): Promise<void> {
    throw new ProviderNotImplementedError(
      `Resend (chave configurada: ${this.apiKey ? "sim" : "não"})`,
    );
  }
}
