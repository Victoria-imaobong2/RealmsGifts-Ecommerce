import { cache } from "react";
import { prisma, isDatabaseConfigured } from "@/lib/db";
import { FALLBACK_IMAGE } from "./images";
import { STARTER_CATALOG } from "./products";
import { getCategory, type CategorySlug } from "./taxonomy";
import type { Product, ProductSummary } from "./types";

export * from "./types";

/**
 * Products created through the admin dashboard live in the database. They are
 * merged into the storefront catalogue alongside the starter catalogue.
 */
async function loadStoreProducts(): Promise<Product[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await prisma.product.findMany({
      include: { variants: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => {
      const colors = [...new Set(row.variants.map((v) => v.color).filter(Boolean))] as string[];
      const sizes = [...new Set(row.variants.map((v) => v.size).filter(Boolean))] as string[];
      const options = [
        colors.length > 1 || (colors.length === 1 && colors[0] !== "Default") ? { name: "Color", values: colors } : null,
        sizes.length > 1 || (sizes.length === 1 && sizes[0] !== "Standard") ? { name: "Size", values: sizes } : null,
      ].filter((option): option is { name: string; values: string[] } => option !== null);
      const category = (getCategory(row.category ?? "")?.slug ?? "gift-boxes") as CategorySlug;
      return {
        id: row.id,
        slug: row.slug ?? row.id,
        name: row.title,
        shortDescription: row.description.split(". ")[0],
        description: row.description,
        price: row.price,
        currency: "USD",
        sku: `RG-STORE-${row.id.slice(-6).toUpperCase()}`,
        category,
        images: row.images.length
          ? row.images.map((src) => ({ src, alt: row.title }))
          : [FALLBACK_IMAGE],
        occasions: [],
        recipients: [],
        options: options.length ? options : undefined,
        giftWrap: true,
        sameDayEligible: false,
        stock: row.stock,
        addedAt: row.createdAt.toISOString().slice(0, 10),
        source: "store",
      } satisfies Product;
    });
  } catch (error) {
    console.error("[catalog] Store products unavailable, using starter catalogue only:", error);
    return [];
  }
}

/** Full catalogue, deduplicated per request. */
export const getCatalog = cache(async (): Promise<Product[]> => {
  const store = await loadStoreProducts();
  const storeSlugs = new Set(store.map((product) => product.slug));
  return [...store, ...STARTER_CATALOG.filter((product) => !storeSlugs.has(product.slug))];
});

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const catalog = await getCatalog();
  return catalog.find((product) => product.slug === slug || product.id === slug);
}

export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  const catalog = await getCatalog();
  return slugs
    .map((slug) => catalog.find((product) => product.slug === slug))
    .filter((product): product is Product => Boolean(product));
}

export function toSummary(product: Product): ProductSummary {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    currency: product.currency,
    category: product.category,
    images: product.images.slice(0, 2),
    stock: product.stock,
    options: product.options,
    personalization: product.personalization,
    sameDayEligible: product.sameDayEligible,
    bundleItems: product.bundleItems,
    addedAt: product.addedAt,
    featured: product.featured,
  };
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const catalog = await getCatalog();
  return catalog
    .filter((candidate) => candidate.slug !== product.slug)
    .map((candidate) => ({
      candidate,
      score:
        (candidate.category === product.category ? 3 : 0) +
        candidate.occasions.filter((o) => product.occasions.includes(o)).length +
        candidate.recipients.filter((r) => product.recipients.includes(r)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}
