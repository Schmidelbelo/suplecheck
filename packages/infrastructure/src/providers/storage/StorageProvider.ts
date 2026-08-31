export interface UploadInput {
  readonly key: string;
  readonly content: Buffer | string;
  readonly contentType: string;
}

export interface StoredObject {
  readonly key: string;
  readonly url: string;
  readonly sizeBytes: number;
}

/** Armazenamento de arquivos binários (imagens de produto, exports gerados). */
export interface StorageProvider {
  upload(input: UploadInput): Promise<StoredObject>;
  download(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}
