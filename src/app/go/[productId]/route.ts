import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { resolveOutboundClick } from "@/modules/monetization/services/outboundClick.service";
import { trackServerEvent } from "@/modules/analytics/services/analytics.server";
import { ANALYTICS_EVENTS } from "@/modules/analytics/types/event";

type Params = { params: Promise<{ productId: string }> };

/**
 * Ponto único de saída do SupleScore para qualquer loja — todo "Ver
 * oferta"/"Comprar"/link de produto externo passa por aqui (ver
 * `buildOutboundHref`, nunca um `href` direto pra loja). Fluxo: resolve
 * produto → registra o clique → decide a URL real (afiliado quando a
 * loja tiver programa configurado, senão a URL normal) → redirect 302.
 * 302 (não 301) porque a URL de destino pode mudar a qualquer nova
 * captura de preço — nunca queremos um navegador cacheando isto como
 * permanente.
 */
export async function GET(request: Request, { params }: Params) {
  try {
    const { productId } = await params;
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") ?? "unknown";
    const positionParam = searchParams.get("position");
    const position = positionParam ? Number.parseInt(positionParam, 10) : null;

    const result = await resolveOutboundClick({
      productIdOrSlug: productId,
      source,
      position: Number.isFinite(position) ? position : null,
    });

    if (result.status === "not_found") {
      // Route Handler, não uma página — `notFound()` de "next/navigation"
      // é para a árvore de renderização de páginas e não se aplica aqui;
      // a resposta 404 correta é devolvida diretamente.
      return NextResponse.json(
        { code: "PRODUCT_NOT_FOUND", message: "Produto não encontrado." },
        { status: 404 },
      );
    }

    if (result.status === "no_offer") {
      // Produto real, mas sem nenhuma oferta cadastrada — nunca um link
      // quebrado: manda para a própria página do produto.
      return NextResponse.redirect(new URL(`/creatina/${result.productSlug}`, request.url), 302);
    }

    trackServerEvent(ANALYTICS_EVENTS.OUTBOUND_LINK_CLICKED, {
      source,
      isAffiliate: result.isAffiliateLink,
    });

    return NextResponse.redirect(result.url, 302);
  } catch (error) {
    console.error("[go] erro inesperado", error);
    Sentry.captureException(error);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: "Erro interno" }, { status: 500 });
  }
}
