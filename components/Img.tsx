import Image, { type ImageProps } from "next/image";
import { isOptimizable } from "@/lib/utils";

/**
 * next/image that also accepts arbitrary URLs pasted in the admin panel:
 * hosts not configured for the optimizer are rendered unoptimized.
 */
export default function Img({ src, alt, ...rest }: Omit<ImageProps, "src"> & { src: string }) {
  if (!src) {
    return <div className={`bg-linear-to-br from-neutral-200 to-neutral-300 ${rest.fill ? "absolute inset-0" : ""} ${rest.className ?? ""}`} />;
  }
  return <Image src={src} alt={alt} unoptimized={!isOptimizable(src)} {...rest} />;
}
