import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";
import { getCatalog } from "@/lib/catalog";
import { CATEGORIES, OCCASIONS, RECIPIENTS } from "@/lib/catalog/taxonomy";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const now = new Date();
  const staticPaths = ["", "/shop", "/categories", "/occasions", "/recipients", "/gift-finder", "/track-order", "/about", "/contact", "/delivery", "/returns", "/faq", "/privacy", "/terms"];
  const catalog = await getCatalog();

  return [
    ...staticPaths.map((path) => ({ url: `${base}${path}`, lastModified: now, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.6 })),
    ...CATEGORIES.map((c) => ({ url: `${base}/shop/${c.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...OCCASIONS.map((o) => ({ url: `${base}/occasion/${o.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...RECIPIENTS.map((r) => ({ url: `${base}/gifts-for-${r.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...catalog.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: new Date(p.addedAt), changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
