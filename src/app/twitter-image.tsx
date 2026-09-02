import { ImageResponse } from "next/og";
import { ogImageElement } from "@/lib/seo/brandMark";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(ogImageElement(), { ...size });
}
