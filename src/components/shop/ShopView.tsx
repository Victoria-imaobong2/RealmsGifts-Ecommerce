import Link from "next/link";
import { Suspense } from "react";
import { SearchX, X } from "lucide-react";
import { getDestination } from "@/config/delivery";
import { SITE } from "@/config/site";
import { getCatalog, toSummary } from "@/lib/catalog";
import { parseFilters, queryCatalog, SORT_OPTIONS, type CatalogFilters } from "@/lib/catalog/query";
import { getBudget, getCategory, getOccasion, getRecipient } from "@/lib/catalog/taxonomy";
import { ProductGrid } from "@/components/product/ProductCard";
import { ButtonLink, buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/primitives";
import { FilterSidebar, MobileFilters, SortSelect, type FixedFilter } from "./FilterPanel";

const PAGE_SIZE = 24;

type Params = Record<string, string | string[] | undefined>;

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {index > 0 && <span aria-hidden>/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-forest">{item.label}</Link>
            ) : (
              <span aria-current="page" className="text-ink">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function SampleNotice() {
  if (!SITE.sampleCatalog) return null;
  return (
    <p className="rounded-xl bg-gold-soft/70 px-4 py-2.5 text-xs leading-relaxed text-forest-dark">
      <strong className="font-semibold">Preview catalogue:</strong> listings, prices and availability are samples while our
      full collection is being finalized.
    </p>
  );
}

function activeChips(filters: CatalogFilters, fixed: FixedFilter | undefined) {
  const chips: { key: string; label: string }[] = [];
  if (filters.q) chips.push({ key: "q", label: `“${filters.q}”` });
  if (filters.category && fixed !== "category") chips.push({ key: "category", label: getCategory(filters.category)?.name ?? filters.category });
  if (filters.occasion && fixed !== "occasion") chips.push({ key: "occasion", label: getOccasion(filters.occasion)?.name ?? filters.occasion });
  if (filters.recipient && fixed !== "recipient") chips.push({ key: "recipient", label: `For ${getRecipient(filters.recipient)?.name ?? filters.recipient}` });
  if (filters.budget) chips.push({ key: "budget", label: getBudget(filters.budget)?.label ?? filters.budget });
  if (filters.minPrice) chips.push({ key: "minPrice", label: `From $${filters.minPrice}` });
  if (filters.maxPrice) chips.push({ key: "maxPrice", label: `Up to $${filters.maxPrice}` });
  if (filters.type) chips.push({ key: "type", label: filters.type === "bundle" ? "Bundles" : "Individual gifts" });
  if (filters.availability) chips.push({ key: "availability", label: "Available to order" });
  if (filters.shipTo) chips.push({ key: "shipTo", label: `Delivers to ${getDestination(filters.shipTo)?.name ?? filters.shipTo}` });
  if (filters.speed) chips.push({ key: "speed", label: "Same-day eligible" });
  return chips;
}

function hrefWithout(basePath: string, params: Params, key: string) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (k === key || k === "page" || v === undefined) continue;
    next.set(k, Array.isArray(v) ? v[0] : v);
  }
  const query = next.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export async function ShopView({
  title,
  description,
  eyebrow,
  basePath,
  searchParams,
  fixed,
  breadcrumbs,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  basePath: string;
  searchParams: Params;
  fixed?: { key: FixedFilter; value: string };
  breadcrumbs: { href?: string; label: string }[];
}) {
  const filters = parseFilters({ ...searchParams, ...(fixed ? { [fixed.key]: fixed.value } : {}) });
  const catalog = await getCatalog();
  const results = queryCatalog(catalog, filters);
  const page = Math.max(1, Number(searchParams.page) || 1);
  const visible = results.slice(0, page * PAGE_SIZE);
  const chips = activeChips(filters, fixed?.key);
  const sortLabel = SORT_OPTIONS.find((o) => o.value === filters.sort)?.label;

  const nextPage = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) if (v !== undefined && k !== "page") nextPage.set(k, Array.isArray(v) ? v[0] : v);
  nextPage.set("page", String(page + 1));

  return (
    <div className="container-page py-8 sm:py-12">
      <Breadcrumbs items={breadcrumbs} />
      <header className="mt-5 max-w-3xl">
        {eyebrow && <p className="eyebrow text-forest">{eyebrow}</p>}
        <h1 className="mt-2 text-4xl leading-tight text-ink sm:text-5xl">{title}</h1>
        {description && <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">{description}</p>}
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[15rem_1fr]">
        <Suspense>
          <FilterSidebar fixed={fixed?.key} />
        </Suspense>

        <section aria-label="Products">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <p className="text-sm text-muted" aria-live="polite">
              {results.length} gift{results.length === 1 ? "" : "s"}
              {sortLabel && filters.sort !== "featured" ? ` · ${sortLabel}` : ""}
            </p>
            <div className="flex items-center gap-2">
              <Suspense>
                <MobileFilters fixed={fixed?.key} resultCount={results.length} />
                <SortSelect />
              </Suspense>
            </div>
          </div>

          {chips.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Active filters">
              {chips.map((chip) => (
                <li key={chip.key}>
                  <Link href={hrefWithout(basePath, searchParams, chip.key)} className="inline-flex items-center gap-1.5 rounded-full bg-forest-soft py-1.5 pl-3.5 pr-2.5 text-sm text-forest hover:bg-forest hover:text-ivory">
                    {chip.label} <X size={14} aria-label="Remove filter" />
                  </Link>
                </li>
              ))}
              <li>
                <Link href={basePath} className="inline-block px-2 py-1.5 text-sm text-muted underline-offset-4 hover:underline">
                  Clear all
                </Link>
              </li>
            </ul>
          )}

          <div className="mt-4">
            <SampleNotice />
          </div>

          {results.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No gifts match those filters"
              description="Try removing a filter or two, or let our gift finder suggest something."
              action={
                <div className="flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href={basePath}>Clear filters</ButtonLink>
                  <ButtonLink href="/gift-finder" variant="secondary">Try the gift finder</ButtonLink>
                </div>
              }
            />
          ) : (
            <>
              <ProductGrid products={visible.map(toSummary)} className="mt-8 lg:grid-cols-3 xl:grid-cols-4" priorityCount={4} />
              <div className="mt-12 flex flex-col items-center gap-3">
                <p className="text-sm text-muted">
                  Showing {visible.length} of {results.length}
                </p>
                {visible.length < results.length && (
                  <Link href={`${basePath}?${nextPage}`} scroll={false} className={buttonClasses({ variant: "secondary" })}>
                    Load more gifts
                  </Link>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
