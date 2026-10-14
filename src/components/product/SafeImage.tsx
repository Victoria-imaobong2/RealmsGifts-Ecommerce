"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { FALLBACK_IMAGE } from "@/lib/catalog/images";

/** next/image that swaps to a branded placeholder instead of a broken-image icon. */
export function SafeImage({ src, alt, ...props }: ImageProps) {
  const [failedSrc, setFailedSrc] = useState<ImageProps["src"] | null>(null);
  const failed = failedSrc === src;
  return (
    <Image
      {...props}
      src={failed || !src ? FALLBACK_IMAGE.src : src}
      alt={failed ? `${alt} (image unavailable)` : alt}
      onError={() => setFailedSrc(src)}
    />
  );
}
