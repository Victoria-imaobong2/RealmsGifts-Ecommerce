"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { AVAILABLE_DESTINATIONS, destinationSupportsSameDay } from "@/config/delivery";

const SAME_DAY_DESTINATIONS = AVAILABLE_DESTINATIONS.filter((d) => destinationSupportsSameDay(d.code));
import { SORT_OPTIONS } from "@/lib/catalog/query";
import { BUDGETS, CATEGORIES, OCCASIONS, RECIPIENTS } from "@/lib/catalog/taxonomy";
import { cn } from "@/lib/cn";
import { useDialog } from "@/lib/hooks";
import { Select } from "@/components/ui/primitives";

export type FixedFilter = "category" | "occasion" | "recipient";

function useFilterNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    const query = next.toString();
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  };

  return { params, update, pending };
}

function RadioGroup({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string | null) => void;
}) {
  return (
    <fieldset className="border-b border-line py-5">
      <legend className="eyebrow mb-3 text-ink">{legend}</legend>
      <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
        {[{ value: "", label: "All" }, ...options].map((option) => (
          <label key={option.value || "all"} className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-sm text-ink hover:text-forest">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value || null)}
              className="h-4 w-4 accent-[var(--color-forest)]"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Filters({ fixed }: { fixed?: FixedFilter }) {
  const { params, update } = useFilterNavigation();
  const get = (key: string) => params.get(key) ?? "";

  return (
    <div>
      {fixed !== "category" && (
        <RadioGroup name="category" legend="Category" value={get("category")} onChange={(v) => update("category", v)} options={CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))} />
      )}
      {fixed !== "occasion" && (
        <RadioGroup name="occasion" legend="Occasion" value={get("occasion")} onChange={(v) => update("occasion", v)} options={OCCASIONS.map((o) => ({ value: o.slug, label: o.name }))} />
      )}
      {fixed !== "recipient" && (
        <RadioGroup name="recipient" legend="Recipient" value={get("recipient")} onChange={(v) => update("recipient", v)} options={RECIPIENTS.map((r) => ({ value: r.slug, label: r.name }))} />
      )}
      <RadioGroup name="budget" legend="Price" value={get("budget")} onChange={(v) => update("budget", v)} options={BUDGETS.map((b) => ({ value: b.slug, label: b.label }))} />
      <RadioGroup name="type" legend="Product type" value={get("type")} onChange={(v) => update("type", v)} options={[{ value: "single", label: "Individual gifts" }, { value: "bundle", label: "Gift bundles" }]} />

      <fieldset className="border-b border-line py-5">
        <legend className="eyebrow mb-3 text-ink">Availability</legend>
        <label className="flex cursor-pointer items-center gap-3 px-1 py-1.5 text-sm text-ink">
          <input type="checkbox" checked={get("availability") === "in-stock"} onChange={(e) => update("availability", e.target.checked ? "in-stock" : null)} className="h-4 w-4 accent-[var(--color-forest)]" />
          Available to order
        </label>
      </fieldset>

      <fieldset className="py-5">
        <legend className="eyebrow mb-3 text-ink">Delivery</legend>
        <label htmlFor="filter-ship-to" className="mb-1.5 block text-sm text-muted">Delivering to</label>
        <Select id="filter-ship-to" value={get("shipTo")} onChange={(e) => update("shipTo", e.target.value || null)} className="py-2.5 text-sm">
          <option value="">Any destination</option>
          {AVAILABLE_DESTINATIONS.map((d) => (
            <option key={d.code} value={d.code}>{d.name}</option>
          ))}
        </Select>
        {SAME_DAY_DESTINATIONS.length > 0 && (
          <label className="mt-3 flex cursor-pointer items-center gap-3 px-1 py-1.5 text-sm text-ink">
            <input type="checkbox" checked={get("speed") === "same-day"} onChange={(e) => update("speed", e.target.checked ? "same-day" : null)} className="h-4 w-4 accent-[var(--color-forest)]" />
            Same-day eligible
          </label>
        )}
      </fieldset>
    </div>
  );
}

export function SortSelect() {
  const { params, update, pending } = useFilterNavigation();
  return (
    <div className={cn("flex items-center gap-2 transition", pending && "opacity-60")}>
      <label htmlFor="sort" className="hidden text-sm text-muted sm:block">Sort by</label>
      <Select id="sort" value={params.get("sort") ?? "featured"} onChange={(e) => update("sort", e.target.value === "featured" ? null : e.target.value)} className="h-11 w-auto py-0 text-sm">
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </Select>
    </div>
  );
}

export function FilterSidebar({ fixed }: { fixed?: FixedFilter }) {
  return (
    <aside aria-label="Filters" className="hidden lg:block">
      <Filters fixed={fixed} />
    </aside>
  );
}

export function MobileFilters({ fixed, resultCount }: { fixed?: FixedFilter; resultCount: number }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useDialog(open, () => setOpen(false), panelRef);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex h-11 items-center gap-2 rounded-full border border-line bg-white px-5 text-sm font-medium text-ink lg:hidden">
        <SlidersHorizontal size={16} aria-hidden /> Filters
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-forest-dark/40" onClick={() => setOpen(false)} aria-hidden />
          <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Filters" className="absolute inset-y-0 left-0 flex w-[min(90vw,380px)] animate-slide-in-left flex-col bg-ivory">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <p className="font-serif text-xl">Filters</p>
              <button type="button" onClick={() => setOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-cream" aria-label="Close filters">
                <X size={22} aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5">
              <Filters fixed={fixed} />
            </div>
            <div className="border-t border-line p-4">
              <button type="button" onClick={() => setOpen(false)} className="h-12 w-full rounded-full bg-forest text-sm font-semibold text-ivory">
                Show {resultCount} result{resultCount === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
