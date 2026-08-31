import type { StorageProvider, UploadInput, StoredObject } from "./StorageProvider";
import { ProviderNotImplementedError } from "../../errors/InfrastructureError";

/** Stub — Cloudflare R2 é compatível com a API S3; quando implementado, provavelmente reaproveita o mesmo cliente com endpoint customizado em vez de duplicar `S3StorageProviderStub`. */
export class R2StorageProviderStub implements StorageProvider {
  constructor(private readonly bucket: string) {}

  async upload(_input: UploadInput): Promise<StoredObject> {
    this.fail();
  }
  async download(_key: string): Promise<Buffer | null> {
    this.fail();
  }
  async delete(_key: string): Promise<void> {
    this.fail();
  }
  getUrl(key: string): string {
    return `https://${this.bucket}.r2.cloudflarestorage.com/${key}`;
  }

  private fail(): never {
    throw new ProviderNotImplementedError(`Cloudflare R2 (bucket: ${this.bucket})`);
  }
}
