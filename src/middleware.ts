import { NextResponse, type NextRequest } from "next/server";

/**
 * Superfície de escrita administrativa — cadastro/edição/exclusão de
 * Catálogo e Avaliação. Não inclui `/api/leads` nem `/api/contact`
 * (esses são POSTs públicos por design: captura de lead e formulário de
 * contato, não administração de dados). `/api/health` também fica fora
 * (precisa ser lido por monitores externos sem credencial).
 */
const PROTECTED_API_PREFIXES = ["/api/catalog", "/api/evaluation"];
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * `/api/admin/*` (dashboard de jobs) e `/api/cron/*` (gatilho de
 * captura de preço) são protegidos em TODO método, inclusive GET — ao
 * contrário de catálogo/avaliação, cujas leituras são públicas por
 * design, aqui até "ver o status do último job" é informação
 * operacional interna.
 */
const FULLY_PROTECTED_API_PREFIXES = ["/api/admin", "/api/cron"];

function extractApiKey(request: NextRequest): string | null {
  const headerKey = request.headers.get("x-api-key");
  if (headerKey) return headerKey;
  // Vercel Cron (e a maioria dos agendadores externos) envia
  // `Authorization: Bearer <segredo>`, não `x-api-key` — aceitar os
  // dois formatos evita reinventar uma segunda variável de ambiente só
  // para o cron.
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice("Bearer ".length);
  return null;
}

/**
 * Endpoints públicos de escrita (sem API Key, por design — qualquer
 * visitante pode enviar) — os únicos que precisam de rate limiting real,
 * já que os de catálogo/avaliação já exigem `ADMIN_API_KEY`.
 */
const PUBLIC_WRITE_RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  "/api/leads": { limit: 5, windowMs: 60_000 },
  "/api/contact": { limit: 5, windowMs: 60_000 },
};

/**
 * Rate limit em memória, por IP + rota, janela fixa. Suficiente contra
 * abuso de script simples em uma instância única — não substitui um
 * limiter distribuído (Upstash/Vercel KV) se o tráfego crescer a ponto
 * de rodar múltiplas instâncias com padrões de abuso coordenados entre
 * elas; documentado como limitação conhecida em docs/DEPLOY.md.
 */
const requestLog = new Map<string, number[]>();

function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(key) ?? []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  requestLog.set(key, timestamps);

  // Evita crescimento ilimitado do Map ao longo da vida do processo —
  // poda oportunista a cada checagem, não precisa de um timer dedicado.
  if (requestLog.size > 5000) {
    for (const [k, v] of requestLog) {
      if (v.every((t) => now - t >= windowMs)) requestLog.delete(k);
    }
  }

  return timestamps.length > limit;
}

function clientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Autenticação por API Key — não há login de usuário nesta fase (Beta
 * Público, catálogo gerenciado internamente). Sem isto, qualquer
 * visitante podia criar/editar/apagar produtos, marcas e metodologias
 * via API (achado crítico da auditoria pré-Beta). `x-api-key` é checada
 * aqui, no middleware, e não em cada `route.ts`, para que nenhuma rota
 * de escrita nova esqueça de aplicar a checagem.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isWriteProtectedPath = PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isFullyProtectedPath = FULLY_PROTECTED_API_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isWriteMethod = WRITE_METHODS.has(request.method);

  if ((isWriteProtectedPath && isWriteMethod) || isFullyProtectedPath) {
    const expectedKey = process.env.ADMIN_API_KEY;
    if (!expectedKey) {
      return NextResponse.json(
        { code: "SERVER_MISCONFIGURED", message: "ADMIN_API_KEY não configurada no servidor." },
        { status: 500 },
      );
    }

    const providedKey = extractApiKey(request);
    if (!providedKey) {
      return NextResponse.json(
        {
          code: "UNAUTHORIZED",
          message: "Cabeçalho x-api-key (ou Authorization: Bearer) ausente.",
        },
        { status: 401 },
      );
    }
    if (providedKey !== expectedKey) {
      return NextResponse.json(
        { code: "FORBIDDEN", message: "API Key inválida." },
        { status: 403 },
      );
    }
  }

  const rateLimit = request.method === "POST" ? PUBLIC_WRITE_RATE_LIMITS[pathname] : undefined;
  if (rateLimit) {
    const key = `${clientIp(request)}:${pathname}`;
    if (isRateLimited(key, rateLimit.limit, rateLimit.windowMs)) {
      return NextResponse.json(
        { code: "RATE_LIMITED", message: "Muitas requisições. Tente novamente em instantes." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.windowMs / 1000)) } },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
