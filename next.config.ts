import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Domínios de imagens de produto/CDN são adicionados aqui conforme
      // o catálogo cresce (ex: Supabase Storage, Cloudinary, CDN próprio).
    ],
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Ativos servidos de /public: nome de arquivo estável (não hasheado
        // pelo build, ao contrário de /_next/static, que o Next já cacheia
        // agressivamente sozinho) — cache longo é seguro porque o conteúdo
        // deste diretório é código-fonte versionado, não gerado por usuário.
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        // Ícones/OG gerados via next/og (ImageResponse) na primeira
        // requisição — cache reduz recomputação sem exigir revalidação
        // manual (o conteúdo só muda quando o código muda, e um novo
        // deploy já invalida o cache do CDN pela nova build).
        source: "/(icon|apple-icon|opengraph-image|twitter-image|icon-192.png|icon-512.png)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
};

// `withSentryConfig` só faz diferença de fato quando SENTRY_AUTH_TOKEN
// está configurado no ambiente de build (upload de source maps) — sem
// isso, é essencialmente um no-op sobre o config normal. Ver
// .env.example e docs/DEPLOY.md.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  // Sem envio de source maps/telemetria quando não há projeto Sentry
  // configurado — evita ruído/erros de build em ambientes sem Sentry.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  telemetry: false,
  // Sem Session Replay em nenhuma página (nunca chamamos
  // `Sentry.replayIntegration()`) — remove esse código do bundle em vez
  // de deixar para o tree-shaking genérico do webpack tentar.
  webpack: {
    treeshake: {
      removeDebugLogging: true,
      excludeReplayIframe: true,
      excludeReplayShadowDOM: true,
      excludeReplayCompressionWorker: true,
    },
  },
});
