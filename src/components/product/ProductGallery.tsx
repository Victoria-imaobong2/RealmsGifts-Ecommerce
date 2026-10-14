"use client";

import { useState } from "react";
import type { ProductImage } from "@/lib/catalog/images";
import { cn } from "@/lib/cn";
import { SafeImage } from "./SafeImage";

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row">
      {images.length > 1 && (
        <ul className="scrollbar-none flex gap-3 overflow-x-auto lg:flex-col" aria-label={`${name} images`}>
          {images.map((image, index) => (
            <li key={image.src} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show image ${index + 1}: ${image.alt}`}
                aria-current={index === active}
                className={cn(
                  "relative block h-20 w-16 overflow-hidden rounded-xl bg-cream ring-offset-2 ring-offset-ivory transition sm:h-24 sm:w-20",
                  index === active ? "ring-2 ring-forest" : "opacity-70 hover:opacity-100",
                )}
              >
                <SafeImage src={image.src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-cream sm:aspect-[5/4] lg:aspect-[4/5]">
        {current && (
          <SafeImage
            key={current.src}
            src={current.src}
            alt={current.alt}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="animate-fade-in object-cover"
          />
        )}
      </div>
    </div>
  );
}
