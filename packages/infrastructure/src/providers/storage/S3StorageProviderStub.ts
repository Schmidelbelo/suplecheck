import type { StorageProvider, UploadInput, StoredObject } from "./StorageProvider";
import { ProviderNotImplementedError } from "../../errors/InfrastructureError";

/** Stub — não importa o AWS SDK. Documenta o formato (bucket via `AppConfig.storage.bucket`). */
export class S3StorageProviderStub implements StorageProvider {
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
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  private fail(): never {
    throw new ProviderNotImplementedError(`AWS S3 (bucket: ${this.bucket})`);
  }
}
