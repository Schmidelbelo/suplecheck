import { ImageResponse } from "next/og";
import { brandMarkIcon } from "@/lib/seo/brandMark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(brandMarkIcon(180), { ...size });
}
