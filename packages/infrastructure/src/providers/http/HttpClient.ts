export interface HttpRequestOptions {
  readonly headers?: Readonly<Record<string, string>>;
  readonly timeoutMs?: number;
}

export interface HttpResponse<T> {
  readonly status: number;
  readonly body: T;
}

/** Cliente HTTP genérico — usado por adapters de API externa (marketplaces, provedores de e-mail via HTTP, etc.) em vez de cada um chamar `fetch` diretamente. */
export interface HttpClient {
  get<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  post<T>(url: string, body: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
}
