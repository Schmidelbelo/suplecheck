import type { MailProvider, MailMessage } from "./MailProvider";
import { ProviderNotImplementedError } from "../../errors/InfrastructureError";

/** Stub — não importa `nodemailer`. Config já vem pronta em `AppConfig.mail.smtp`. */
export class SmtpMailProviderStub implements MailProvider {
  constructor(private readonly host: string) {}

  async send(_message: MailMessage): Promise<void> {
    throw new ProviderNotImplementedError(`SMTP (${this.host})`);
  }
}
