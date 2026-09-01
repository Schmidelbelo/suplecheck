import { siteConfig } from "@/config/site";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Chamada HTTP real à própria API do app (`src/app/api/**`) — as páginas
 * públicas de Avaliação (`/creatina`, `/creatina/[slug]`) usam isto para
 * consumir exclusivamente a API criada, nunca ler o banco ou os Use
 * Cases diretamente. `cache: "no-store"`: o Ranking já é um snapshot
 * persistido (Domain Model §3.4) — cachear a resposta HTTP em cima disso
 * só atrasaria refletir uma regeneração.
 */
export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${siteConfig.url}${path}`, { cache: "no-store", ...init });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.code ?? "UNKNOWN_ERROR",
      body?.message ?? `${path} respondeu ${res.status}`,
    );
  }
  return body as T;
}

/** Como `fetchApi`, mas devolve `null` em vez de lançar quando a API responde 404 — para leituras opcionais. */
export async function fetchApiOrNull<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    return await fetchApi<T>(path, init);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
