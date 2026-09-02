import { ImageResponse } from "next/og";
import { brandMarkIcon } from "@/lib/seo/brandMark";

/**
 * Ícone estático em `/icon-192.png` — path fixo porque `manifest.ts`
 * (PWA) precisa de uma URL estável, diferente do path com hash que a
 * convenção `icon.tsx` do Next gera para o favicon.
 */
export async function GET() {
  return new ImageResponse(brandMarkIcon(192), { width: 192, height: 192 });
}
