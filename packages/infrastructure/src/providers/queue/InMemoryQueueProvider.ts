import { randomUUID } from "node:crypto";
import type { QueueProvider, QueueMessage } from "./QueueProvider";

/** Implementação real, útil para desenvolvimento local e para processar filas dentro do mesmo processo (não sobrevive a restart nem escala entre processos — para isso, um futuro `SqsQueueProviderStub`/`RedisQueueProviderStub`). */
export class InMemoryQueueProvider implements QueueProvider {
  private readonly queues = new Map<string, QueueMessage[]>();

  async enqueue<T>(queueName: string, payload: T): Promise<void> {
    const queue = this.queues.get(queueName) ?? [];
    queue.push({ id: randomUUID(), payload, enqueuedAt: new Date() });
    this.queues.set(queueName, queue);
  }

  async dequeue<T>(queueName: string): Promise<QueueMessage<T> | null> {
    const queue = this.queues.get(queueName);
    return (queue?.shift() as QueueMessage<T> | undefined) ?? null;
  }

  async size(queueName: string): Promise<number> {
    return this.queues.get(queueName)?.length ?? 0;
  }
}
