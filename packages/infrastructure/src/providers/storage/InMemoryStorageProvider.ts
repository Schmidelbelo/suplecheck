import type { StorageProvider, UploadInput, StoredObject } from "./StorageProvider";

/** Implementação real, guarda bytes em memória — suficiente para desenvolvimento local e testes; nunca deve ser usada em produção (dados somem a cada restart). */
export class InMemoryStorageProvider implements StorageProvider {
  private readonly objects = new Map<string, { content: Buffer; contentType: string }>();

  constructor(private readonly baseUrl: string = "memory://storage") {}

  async upload(input: UploadInput): Promise<StoredObject> {
    const content = Buffer.isBuffer(input.content)
      ? input.content
      : Buffer.from(input.content, "utf-8");
    this.objects.set(input.key, { content, contentType: input.contentType });
    return { key: input.key, url: this.getUrl(input.key), sizeBytes: content.byteLength };
  }

  async download(key: string): Promise<Buffer | null> {
    return this.objects.get(key)?.content ?? null;
  }

  async delete(key: string): Promise<void> {
    this.objects.delete(key);
  }

  getUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }
}
