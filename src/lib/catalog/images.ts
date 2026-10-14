export interface ProductImage {
  src: string;
  alt: string;
}

/**
 * Builds an Unsplash CDN image reference. All photos used in the starter
 * catalogue were chosen from Unsplash's free (non-Unsplash+) library and
 * checked by eye to match the product they illustrate.
 */
export function unsplash(id: string, alt: string): ProductImage {
  return { src: `https://images.unsplash.com/photo-${id}`, alt };
}

export const FALLBACK_IMAGE: ProductImage = {
  src: "/placeholder-gift.svg",
  alt: "Image coming soon",
};
