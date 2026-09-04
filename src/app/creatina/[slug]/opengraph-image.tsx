import { ImageResponse } from "next/og";
import { fetchApiOrNull } from "@/lib/api/fetchApi";
import { classificationLabel } from "@/modules/evaluation/lib/classification";
import type { ProductView } from "@/modules/evaluation/types";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BRAND_DARK_BG = "#121417";

/**
 * OG image por produto — `generateMetadata` de `page.tsx` já define seu
 * próprio `openGraph` (via `buildMetadata`), o que faz o Next parar de
 * herdar `app/opengraph-image.tsx` (a imagem genérica do site) para
 * esta rota. Em vez de tentar restaurar a herança, geramos uma imagem
 * real por produto — nome, marca, nota — o que é estritamente melhor
 * para compartilhamento social do que a imagem genérica teria sido.
 * Dados 100% reais, buscados pela mesma API que a própria página usa.
 */
export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const view = await fetchApiOrNull<ProductView>(`/api/evaluation/products/${slug}/view`);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        background: BRAND_DARK_BG,
        padding: 80,
        textAlign: "center",
      }}
    >
      <span style={{ color: "#ced4da", fontSize: 28, fontFamily: "sans-serif" }}>SupleScore</span>
      <span
        style={{
          color: "#ffffff",
          fontSize: 56,
          fontWeight: 700,
          fontFamily: "sans-serif",
          lineHeight: 1.2,
        }}
      >
        {view?.product.name ?? "Produto"}
      </span>
      {view?.score ? (
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <span
            style={{ color: "#46dc8b", fontSize: 96, fontWeight: 700, fontFamily: "sans-serif" }}
          >
            {view.score.finalScore.toFixed(1)}
          </span>
          <span style={{ color: "#ced4da", fontSize: 32, fontFamily: "sans-serif" }}>
            {classificationLabel(view.score.classificationTier)} · Índice SupleScore
          </span>
        </div>
      ) : null}
    </div>,
    { ...size },
  );
}
