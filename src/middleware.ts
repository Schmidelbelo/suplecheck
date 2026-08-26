import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware global. Hoje é passthrough — ponto de extensão único para
 * autenticação de rotas `(account)`/`admin`, rate limiting da API e
 * redirects, quando essas fases forem implementadas.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
