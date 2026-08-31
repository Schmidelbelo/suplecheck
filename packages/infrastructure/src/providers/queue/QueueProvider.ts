export interface QueueMessage<T = unknown> {
  readonly id: string;
  readonly payload: T;
  readonly enqueuedAt: Date;
}

/** Fila assíncrona genérica (ex: futura fila de recálculo de Índice em lote, envio de e-mail). */
export interface QueueProvider {
  enqueue<T>(queueName: string, payload: T): Promise<void>;
  /** Consome e remove a próxima mensagem, se houver — quem implementa um worker real chama isto em loop. */
  dequeue<T>(queueName: string): Promise<QueueMessage<T> | null>;
  size(queueName: string): Promise<number>;
}
