import { ImageResponse } from "next/og";
import { brandMarkIcon } from "@/lib/seo/brandMark";

/** Ícone estático em `/icon-512.png` — mesma razão de `/icon-192.png/route.ts`. */
export async function GET() {
  return new ImageResponse(brandMarkIcon(512), { width: 512, height: 512 });
}
