/**
 * Marca visual gerada via `next/og` (`ImageResponse`) — favicon, ícones
 * de app/PWA, e imagem de Open Graph/Twitter Card compartilham o MESMO
 * elemento, só variando tamanho e se mostram o wordmark. Nenhum arquivo
 * de imagem estático: gerado em build/request, sempre em sincronia com
 * a cor de marca real (`--brand-700`, `src/styles/tokens.css`) — se o
 * token mudar, estes ícones mudam junto, sem precisar reexportar PNGs.
 * Espelha o mark de `src/components/shared/Logo.tsx` (quadrado
 * arredondado, "S" branco) para manter a mesma identidade visual em
 * toda a plataforma.
 */

const BRAND = "#127c47"; // brand-700 — mesmo token usado por --color-brand (tokens.css)
const BRAND_DARK_BG = "#121417"; // neutral-950 — mesmo fundo usado no FinalCTA

export function brandMarkIcon(size: number) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: BRAND,
        borderRadius: size * 0.22,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          color: "#ffffff",
          fontSize: size * 0.58,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        S
      </span>
    </div>
  );
}

export function ogImageElement() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        background: BRAND_DARK_BG,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {brandMarkIcon(96)}
        <span style={{ color: "#ffffff", fontSize: 72, fontWeight: 700, fontFamily: "sans-serif" }}>
          Suple<span style={{ color: "#46dc8b" }}>Score</span>
        </span>
      </div>
      <span style={{ color: "#ced4da", fontSize: 32, fontFamily: "sans-serif" }}>
        Comparação independente de suplementos
      </span>
    </div>
  );
}
