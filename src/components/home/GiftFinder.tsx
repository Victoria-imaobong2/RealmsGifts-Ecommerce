"use client";

import { useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import type { ProductSummary } from "@/lib/catalog/types";
import { cn } from "@/lib/cn";
import { ProductCard } from "@/components/product/ProductCard";
import { ButtonLink } from "@/components/ui/Button";
import { ProductCardSkeleton } from "@/components/ui/primitives";

const STEPS = [
  {
    key: "recipient",
    question: "Who are you shopping for?",
    options: [
      { value: "her", label: "Her" },
      { value: "him", label: "Him" },
      { value: "mom", label: "Mom" },
      { value: "dad", label: "Dad" },
      { value: "partner", label: "Partner" },
      { value: "friend", label: "Friend" },
      { value: "coworker", label: "Coworker" },
      { value: "family", label: "Family" },
    ],
  },
  {
    key: "occasion",
    question: "What's the occasion?",
    options: [
      { value: "birthday", label: "Birthday" },
      { value: "anniversary", label: "Anniversary" },
      { value: "graduation", label: "Graduation" },
      { value: "thank-you", label: "Thank You" },
      { value: "just-because", label: "Just Because" },
      { value: "", label: "Other" },
    ],
  },
  {
    key: "budget",
    question: "What's your budget?",
    options: [
      { value: "maxPrice=25", label: "Under $25" },
      { value: "minPrice=25&maxPrice=50", label: "$25–$50" },
      { value: "minPrice=50&maxPrice=100", label: "$50–$100" },
      { value: "minPrice=100", label: "$100+" },
    ],
  },
] as const;

type Answers = Partial<Record<(typeof STEPS)[number]["key"], string>>;

/**
 * A deterministic gift finder: it filters the catalogue by the shopper's
 * answers (no AI involved). If nothing matches exactly it relaxes the
 * occasion and says so.
 */
export function GiftFinder({ compact = false }: { compact?: boolean }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [results, setResults] = useState<{ products: ProductSummary[]; relaxed: boolean; query: string } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const fetchResults = async (final: Answers) => {
    setStatus("loading");
    const base = new URLSearchParams();
    if (final.recipient) base.set("recipient", final.recipient);
    const budget = final.budget ?? "";
    const exact = new URLSearchParams(`${base}&${budget}`);
    if (final.occasion) exact.set("occasion", final.occasion);
    try {
      const get = async (params: URLSearchParams) => (await fetch(`/api/products?${params}&limit=8`)).json();
      let data = await get(exact);
      let relaxed = false;
      let query = exact.toString();
      if (!data.products?.length && final.occasion) {
        const looser = new URLSearchParams(`${base}&${budget}`);
        data = await get(looser);
        relaxed = true;
        query = looser.toString();
      }
      setResults({ products: data.products ?? [], relaxed, query });
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  const choose = (value: string) => {
    const current = STEPS[step];
    const next = { ...answers, [current.key]: value };
    setAnswers(next);
    if (step < STEPS.length - 1) setStep(step + 1);
    else {
      setStep(STEPS.length);
      fetchResults(next);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setResults(null);
    setStatus("idle");
  };

  const current = STEPS[step];

  return (
    <div className={cn("rounded-[2rem] bg-cream/70 p-5 sm:p-10", compact && "bg-transparent p-0 sm:p-0")}>
      {current ? (
        <div>
          <div className="flex items-center justify-between gap-4">
            <p className="eyebrow text-forest" aria-live="polite">
              Step {step + 1} of {STEPS.length}
            </p>
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} className="flex items-center gap-1 text-sm text-muted hover:text-forest">
                <ArrowLeft size={14} aria-hidden /> Back
              </button>
            )}
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-line" aria-hidden>
            <div className="h-full rounded-full bg-forest transition-all duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
          <fieldset className="mt-6">
            <legend className="font-serif text-2xl text-ink sm:text-3xl">{current.question}</legend>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {current.options.map((option) => {
                const selected = answers[current.key] === option.value;
                return (
                  <button
                    key={option.label}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => choose(option.value)}
                    className={cn(
                      "h-14 rounded-2xl border px-4 text-[15px] font-medium transition duration-200 motion-safe:hover:-translate-y-0.5",
                      selected ? "border-forest bg-forest text-ivory" : "border-line bg-white text-ink hover:border-forest",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      ) : (
        <div aria-live="polite">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-forest">Our suggestions</p>
              <h3 className="mt-2 text-2xl text-ink sm:text-3xl">
                {status === "loading" ? "Finding gifts…" : results?.products.length ? "Gifts we think they'll love" : "Let's try something else"}
              </h3>
              {results?.relaxed && results.products.length > 0 && (
                <p className="mt-1 text-sm text-muted">We didn&apos;t find an exact match for that occasion, so here are close favorites.</p>
              )}
            </div>
            <button type="button" onClick={reset} className="flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline">
              <RotateCcw size={14} aria-hidden /> Start over
            </button>
          </div>

          {status === "error" && <p className="mt-6 text-sm text-sale">We couldn&apos;t load suggestions. Please try again.</p>}

          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {status === "loading"
              ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
              : results?.products.slice(0, 8).map((product) => <ProductCard key={product.slug} product={product} />)}
          </div>

          {status === "idle" && results && results.products.length === 0 && (
            <p className="mt-2 text-sm text-muted">Nothing matches every answer yet. Try a different budget, or browse all gifts.</p>
          )}
          {status === "idle" && results && (
            <div className="mt-8">
              <ButtonLink href={results.products.length ? `/shop?${results.query}` : "/shop"} variant="secondary">
                {results.products.length ? "See all matching gifts" : "Browse all gifts"}
              </ButtonLink>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
