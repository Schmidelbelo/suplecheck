import type { MailProvider, MailMessage } from "./MailProvider";
import type { Logger } from "../../logging/Logger";

/** Null Object — não envia nada de verdade, só loga. Padrão da plataforma até SMTP/Resend serem configurados (ver `AppConfig.mail.provider === "null"`). */
export class NullMailProvider implements MailProvider {
  constructor(private readonly logger: Logger) {}

  async send(message: MailMessage): Promise<void> {
    this.logger.info("e-mail não enviado (provedor null)", {
      to: message.to,
      subject: message.subject,
    });
  }
}
