export interface MailMessage {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly from?: string;
}

export interface MailProvider {
  send(message: MailMessage): Promise<void>;
}
