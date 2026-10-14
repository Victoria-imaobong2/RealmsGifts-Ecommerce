import type { ProductImage } from "./images";
import type { CategorySlug, OccasionSlug, RecipientSlug } from "./taxonomy";

export type CurrencyCode = "USD" | "CAD" | "GBP" | "EUR" | "NGN";

export interface ProductOption {
  name: string;
  values: string[];
}

export interface ProductDetail {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  /** Only set when a genuine, current markdown exists. */
  compareAtPrice?: number;
  currency: CurrencyCode;
  sku: string;
  category: CategorySlug;
  subcategory?: string;
  images: ProductImage[];
  occasions: OccasionSlug[];
  recipients: RecipientSlug[];
  options?: ProductOption[];
  /** Category-relevant facts only (material, allergens, specs…). */
  details?: ProductDetail[];
  care?: string;
  personalization?: { label: string; placeholder?: string; maxLength: number };
  giftWrap: boolean;
  /** Can be fulfilled by a local partner where same-day delivery exists. */
  sameDayEligible: boolean;
  /** null = inventory isn't tracked for this item. */
  stock: number | null;
  featured?: boolean;
  addedAt: string;
  /** Slugs of the products included when this item is a bundle. */
  bundleItems?: string[];
  source: "starter" | "store";
}

/** The subset of product data safe and small enough to send to the browser in lists. */
export type ProductSummary = Pick<
  Product,
  | "id"
  | "slug"
  | "name"
  | "price"
  | "compareAtPrice"
  | "currency"
  | "category"
  | "images"
  | "stock"
  | "options"
  | "personalization"
  | "sameDayEligible"
  | "bundleItems"
  | "addedAt"
  | "featured"
>;
