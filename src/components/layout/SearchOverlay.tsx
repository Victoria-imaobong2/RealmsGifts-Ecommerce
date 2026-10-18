"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import type { ProductSummary } from "@/lib/catalog/types";
import type { BUDGETS, Category, Occasion, Recipient, BudgetOption } from "@/lib/catalog/taxonomy";
import { formatMoney } from "@/lib/format";
import { useDialog } from "@/lib/hooks";
import { useUiStore } from "@/store/useUiStore";
import { SafeImage } from "@/components/product/SafeImage";

const POPULAR = ["Birthday", "Mom", "Perfume", "Chocolate", "Jewelry", "Gift box", "Under $50"];

interface Results {
  total: number;
  products: ProductSummary[];
  suggestions?: { categories: Category[]; occasions: Occasion[]; recipients: Recipient[]; budgets: BudgetOption[] };
}

export function SearchOverlay() {
  const open = useUiStore((s) => s.panel === "search");
  const close = useUiStore((s) => s.close);
  const panelRef = useRef<HTMLDivElement>(null);
  useDialog(open, close, panelRef);
  if (!open) return null;
  return <SearchPanel panelRef={panelRef} close={close} />;
}

function SearchPanel({ panelRef, close }: { panelRef: React.RefObject<HTMLDivElement | null>; close: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("loading");
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(trimmed)}&limit=6`, { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        setResults(await res.json());
        setStatus("idle");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setStatus("error");
      }
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  const go = (href: string) => {
    close();
    router.push(href);
  };

  const s = trimmed.length >= 2 ? results?.suggestions : undefined;
  const chips = s
    ? [
        ...s.categories.map((c) => ({ href: `/shop/${c.slug}`, label: c.name, kind: "Category" })),
        ...s.occasions.map((o) => ({ href: `/occasion/${o.slug}`, label: o.name, kind: "Occasion" })),
        ...s.recipients.map((r) => ({ href: `/gifts-for-${r.slug}`, label: r.label, kind: "Recipient" })),
        ...s.budgets.map((b) => ({ href: `/shop?budget=${b.slug}`, label: b.label, kind: "Budget" })),
      ]
    : [];
  const showResults = trimmed.length >= 2 && results;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-forest-dark/40" onClick={close} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="relative max-h-[100dvh] animate-fade-up overflow-y-auto bg-ivory shadow-[var(--shadow-overlay)] sm:max-h-[85vh] sm:rounded-b-3xl"
      >
        <div className="container-page max-w-3xl py-5 sm:py-8">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              if (trimmed) go(`/shop?q=${encodeURIComponent(trimmed)}`);
            }}
            className="flex items-center gap-3"
          >
            <label htmlFor="site-search" className="sr-only">What are you looking for?</label>
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
              <input
                id="site-search"
                data-autofocus
                type="search"
                autoComplete="off"
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What are you looking for?"
                className="h-14 w-full rounded-full border border-line bg-white pl-12 pr-12 text-base text-ink placeholder:text-muted focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15 sm:text-lg"
              />
              {status === "loading" && <Loader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-muted" aria-label="Searching" />}
            </div>
            <button type="button" onClick={close} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-cream" aria-label="Close search">
              <X size={22} aria-hidden />
            </button>
          </form>

          <div className="mt-6" aria-live="polite">
            {!showResults && (
              <div>
                <p className="eyebrow mb-3 text-muted">Popular searches</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setQuery(term)}
                      className="rounded-full border border-line bg-white px-4 py-2 text-sm text-ink transition hover:border-forest hover:text-forest"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {status === "error" && <p className="text-sm text-sale">Search isn&apos;t responding. Please try again.</p>}

            {showResults && (
              <div className="space-y-6">
                {chips.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {chips.map((chip) => (
                      <button key={chip.href} type="button" onClick={() => go(chip.href)} className="rounded-full bg-forest-soft px-4 py-2 text-sm text-forest hover:bg-forest hover:text-ivory">
                        <span className="sr-only">{chip.kind}: </span>
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}

                {results.products.length > 0 ? (
                  <div>
                    <p className="eyebrow mb-3 text-muted">Products</p>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {results.products.map((product) => (
                        <li key={product.slug}>
                          <Link href={`/product/${product.slug}`} onClick={close} className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-white">
                            <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream">
                              {product.images[0] && <SafeImage src={product.images[0].src} alt="" fill sizes="64px" className="object-cover" />}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-ink">{product.name}</span>
                              <span className="text-sm text-muted">{formatMoney(product.price, product.currency)}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <button type="button" onClick={() => go(`/shop?q=${encodeURIComponent(trimmed)}`)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline">
                      View all {results.total} results <ArrowRight size={14} aria-hidden />
                    </button>
                  </div>
                ) : (
                  chips.length === 0 && (
                    <div className="rounded-2xl bg-white p-6 text-center">
                      <p className="font-serif text-xl text-ink">No matches for “{trimmed}”</p>
                      <p className="mt-2 text-sm text-muted">Try a broader word like “flowers” or “birthday”, or let us help you choose.</p>
                      <button type="button" onClick={() => go("/gift-finder")} className="mt-4 text-sm font-semibold text-forest hover:underline">
                        Try the gift finder →
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
