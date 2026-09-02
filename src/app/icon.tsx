import { ImageResponse } from "next/og";
import { brandMarkIcon } from "@/lib/seo/brandMark";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(brandMarkIcon(32), { ...size });
}
