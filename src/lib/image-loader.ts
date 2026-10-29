"use client";

type LoaderArgs = { src: string; width: number; quality?: number };

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  // Cloudinary image processing: inject width, quality, and format transformations on the fly
  if (src.includes("res.cloudinary.com")) {
    if (src.includes("/upload/")) {
      return src.replace("/upload/", `/upload/w_${width},q_${quality ?? 72},f_auto/`);
    }
    return src;
  }

  // Unsplash image processing
  if (src.startsWith("https://images.unsplash.com/")) {
    const url = new URL(src);
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", url.searchParams.get("fit") ?? "crop");
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 72));
    return url.toString();
  }

  // Local assets and any other hosts pass through untouched
  return src;
}