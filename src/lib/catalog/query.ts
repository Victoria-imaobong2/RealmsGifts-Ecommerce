/**
 * Pure catalogue filtering, sorting and search. Safe to run on the server or
 * in the browser.
 */
import { getDestination, destinationSupportsSameDay } from "@/config/delivery";
import {
  BUDGETS,
  CATEGORIES,
  OCCASIONS,
  RECIPIENTS,
  getBudget,
} from "./taxonomy";
import type { Product } from "./types";

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export interface CatalogFilters {
  q?: string;
  category?: string;
  occasion?: string;
  recipient?: string;
  budget?: string;
  maxPrice?: number;
  minPrice?: number;
  type?: "bundle" | "single";
  availability?: "in-stock";
  shipTo?: string;
  speed?: "same-day";
  sort?: SortKey;
}

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export function parseFilters(params: RawParams): CatalogFilters {
  const sort = first(params.sort);
  const type = first(params.type);
  const maxPrice = Number(first(params.maxPrice));
  const minPrice = Number(first(params.minPrice));
  return {
    q: first(params.q)?.trim().slice(0, 80) || undefined,
    category: first(params.category) || undefined,
    occasion: first(params.occasion) || undefined,
    recipient: first(params.recipient) || undefined,
    budget: first(params.budget) || undefined,
    maxPrice: Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : undefined,
    minPrice: Number.isFinite(minPrice) && minPrice > 0 ? minPrice : undefined,
    type: type === "bundle" || type === "single" ? type : undefined,
    availability: first(params.availability) === "in-stock" ? "in-stock" : undefined,
    shipTo: first(params.shipTo) || undefined,
    speed: first(params.speed) === "same-day" ? "same-day" : undefined,
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? (sort as SortKey) : undefined,
  };
}

export function isAvailable(product: Pick<Product, "stock">): boolean {
  return product.stock === null || product.stock > 0;
}

/** Every catalogue item ships to every destination that is currently open. */
export function deliversTo(destinationCode: string | undefined): boolean {
  if (!destinationCode) return true;
  return getDestination(destinationCode)?.status === "available";
}

function matchesFilters(product: Product, filters: CatalogFilters): boolean {
  if (filters.category && product.category !== filters.category) return false;
  if (filters.occasion && !product.occasions.includes(filters.occasion as never)) return false;
  if (filters.recipient && !product.recipients.includes(filters.recipient as never)) return false;
  if (filters.type === "bundle" && !product.bundleItems) return false;
  if (filters.type === "single" && product.bundleItems) return false;
  if (filters.availability === "in-stock" && !isAvailable(product)) return false;
  if (filters.maxPrice !== undefined && product.price > filters.maxPrice) return false;
  if (filters.minPrice !== undefined && product.price < filters.minPrice) return false;
  
  if (filters.budget) {
    const budget = getBudget(filters.budget);
    if (budget) {
      if (budget.min !== undefined && product.price < budget.min) return false;
      if (budget.max !== undefined && budget.max !== null && product.price >= budget.max) return false;
    }
  }

  if (filters.shipTo && !deliversTo(filters.shipTo)) return false;
  if (filters.speed === "same-day") {
    if (!product.sameDayEligible) return false;
    if (filters.shipTo && !destinationSupportsSameDay(filters.shipTo)) return false;
  }
  return true;
}

const normalize = (value: string) =>
  value.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}₦$ ]/gu, " ").replace(/\s+/g, " ").trim();

/** Extracts budget phrases like "under 50k" or "under ₦50000" so the rest can be text-matched. */
export function parseSearchQuery(query: string): { text: string; maxPrice?: number } {
  const match = query.match(/under\s*[₦$]?\s*(\d+)(k)?/i);
  if (!match) return { text: query };
  
  let val = Number(match[1]);
  if (match[2]?.toLowerCase() === "k") val *= 1000;

  return {
    text: query.replace(match[0], " ").trim(),
    maxPrice: val,
  };
}

function searchScore(product: Product, terms: string[]): number {
  const name = normalize(product.name);
  const category = normalize(CATEGORIES.find((c) => c.slug === product.category)?.name ?? "");
  const occasions = normalize(
    product.occasions.map((slug) => OCCASIONS.find((o) => o.slug === slug)?.name ?? "").join(" "),
  );
  const recipients = normalize(
    product.recipients.map((slug) => RECIPIENTS.find((r) => r.slug === slug)?.name ?? "").join(" "),
  );
  const body = normalize(`${product.shortDescription} ${product.description} ${product.subcategory ?? ""}`);

  let score = 0;
  for (const term of terms) {
    const stem = term.length > 3 ? term.replace(/s$/, "") : term;
    if (name.includes(stem)) score += 6;
    else if (category.includes(stem)) score += 4;
    else if (occasions.includes(stem) || recipients.split(" ").includes(stem)) score += 3;
    else if (body.includes(stem)) score += 1;
    else return 0; // every term must match somewhere
  }
  return score;
}

export function queryCatalog(products: Product[], filters: CatalogFilters): Product[] {
  let results = products.filter((product) => matchesFilters(product, filters));

  if (filters.q) {
    const { text, maxPrice } = parseSearchQuery(filters.q);
    if (maxPrice) results = results.filter((product) => product.price < maxPrice);
    const terms = normalize(text).split(" ").filter((t) => t.length > 1 && !STOP_WORDS.has(t));
    if (terms.length) {
      const scored = results
        .map((product) => ({ product, score: searchScore(product, terms) }))
        .filter((entry) => entry.score > 0);
      if (!filters.sort || filters.sort === "featured") {
        return scored.sort((a, b) => b.score - a.score).map((entry) => entry.product);
      }
      results = scored.map((entry) => entry.product);
    }
  }

  return sortProducts(results, filters.sort ?? "featured");
}

const STOP_WORDS = new Set(["for", "the", "a", "an", "and", "gift", "gifts", "to", "my", "of"]);

export function sortProducts(products: Product[], sort: SortKey): Product[] {
  const sorted = [...products];
  switch (sort) {
    case "newest":
      return sorted.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    default:
      return sorted.sort(
        (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || b.addedAt.localeCompare(a.addedAt),
      );
  }
}

/** Suggestions for the search overlay beyond products. */
export function searchTaxonomy(query: string) {
  const q = normalize(query);
  if (q.length < 2) return { categories: [], occasions: [], recipients: [], budgets: [] };
  const hit = (value: string) => normalize(value).includes(q) || q.includes(normalize(value));
  return {
    categories: CATEGORIES.filter((c) => hit(c.name) || hit(c.slug.replace("-", " "))).slice(0, 4),
    occasions: OCCASIONS.filter((o) => hit(o.name)).slice(0, 4),
    recipients: RECIPIENTS.filter((r) => hit(r.name) || hit(r.label)).slice(0, 4),
    budgets: BUDGETS.filter((b) => hit(b.label) || (q.startsWith("under") && b.max !== undefined && b.max !== null && q.includes(String(b.max)))).slice(0, 2),
  };
}