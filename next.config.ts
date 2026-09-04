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

  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.suplescore.com.br" }],
        destination: "https://suplescore.com.br/:path*",
        permanent: true,
      },
    ];
  },

  async headers() {
    // CSP pragmática: permite exatamente os hosts de terceiros que o
    // projeto já carrega (GA4, Clarity, Sentry) — nunca um wildcard
    // genérico. `'unsafe-inline'` em script-src é necessário porque o
    // Next.js App Router injeta scripts inline de hydration/RSC sem
    // nonce configurado (adotar nonce exigiria middleware por request,
    // fora de escopo deste bloco); `'unsafe-eval'` não é necessário e
    // fica de fora. Fontes são self-hosted via `next/font` — sem
    // fonts.googleapis.com/gstatic.com.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms https://*.clarity.ms",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.clarity.ms https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            // HSTS: 2 anos + subdomínios. `preload` não é ativado aqui
            // deliberadamente — exige submissão manual a hstspreload.org
            // e é irreversível por meses; decisão de domínio, não de
            // código (ver docs/DEPLOY.md).
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          { key: "Content-Security-Policy", value: csp },
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
