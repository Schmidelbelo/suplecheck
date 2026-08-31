import type { HttpClient, HttpRequestOptions, HttpResponse } from "./HttpClient";
import { ExternalOperationError } from "../../errors/InfrastructureError";

/**
 * Implementação real (não stub): usa o `fetch` global do Node.js — sem
 * dependência externa. É o único provider desta camada que realmente
 * fala com a rede hoje, porque "fazer uma requisição HTTP" não exige
 * nenhuma credencial nem serviço de terceiro configurado, ao contrário
 * de S3/Redis/SMTP.
 */
export class FetchHttpClient implements HttpClient {
  async get<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>(url, "GET", undefined, options);
  }

  async post<T>(
    url: string,
    body: unknown,
    options?: HttpRequestOptions,
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, "POST", body, options);
  }

  private async request<T>(
    url: string,
    method: string,
    body: unknown,
    options?: HttpRequestOptions,
  ): Promise<HttpResponse<T>> {
    try {
      const controller = new AbortController();
      const timeout = options?.timeoutMs
        ? setTimeout(() => controller.abort(), options.timeoutMs)
        : undefined;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      if (timeout) clearTimeout(timeout);

      const contentType = response.headers.get("content-type") ?? "";
      const parsed = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      return { status: response.status, body: parsed as T };
    } catch (error) {
      throw new ExternalOperationError(`${method} ${url}`, error);
    }
  }
}
