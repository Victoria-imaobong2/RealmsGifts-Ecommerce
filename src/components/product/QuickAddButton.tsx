"use client";

import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import type { ProductSummary } from "@/lib/catalog/types";
import { cn } from "@/lib/cn";
import { useCartStore } from "@/store/useCartStore";
import { useUiStore } from "@/store/useUiStore";

const buttonBase =
  "flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-xs font-semibold tracking-wide transition duration-200 motion-safe:hover:-translate-y-px";

/**
 * Adds to the bag instantly (the store update is synchronous); the check mark
 * is feedback only. Products with options link to the product page instead.
 */
export function QuickAddButton({ product }: { product: ProductSummary }) {
  const addItem = useCartStore((s) => s.addItem);
  const toast = useUiStore((s) => s.toast);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(timer);
  }, [added]);

  const outOfStock = product.stock !== null && product.stock <= 0;
  if (outOfStock) {
    return (
      <button type="button" disabled className={cn(buttonBase, "cursor-not-allowed bg-cream text-muted")}>
        Out of stock
      </button>
    );
  }

  if (product.options?.length) {
    return (
      <Link href={`/product/${product.slug}`} className={cn(buttonBase, "border border-ink/15 bg-white text-ink hover:border-forest hover:text-forest")}>
        Choose options
        <span className="sr-only"> for {product.name}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        addItem({
          productId: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          currency: product.currency,
          image: product.images[0]?.src ?? "",
          options: {},
          sameDayEligible: product.sameDayEligible,
        });
        setAdded(true);
        toast(`${product.name} added to your bag`);
      }}
      className={cn(buttonBase, added ? "bg-success text-white" : "bg-forest text-ivory hover:bg-forest-dark")}
      aria-label={`Add ${product.name} to bag`}
    >
      {added ? (
        <>
          <Check size={14} aria-hidden /> Added
        </>
      ) : (
        <>
          <Plus size={14} aria-hidden /> Add to Bag
        </>
      )}
    </button>
  );
}
