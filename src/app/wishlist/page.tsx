"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import type { ProductSummary } from "@/lib/catalog/types";
import { useHydrated } from "@/lib/hooks";
import { useWishlistStore } from "@/store/useWishlistStore";
import { ProductCard } from "@/components/product/ProductCard";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState, ProductCardSkeleton } from "@/components/ui/primitives";

export default function WishlistPage() {
  const hydrated = useHydrated();
  const slugs = useWishlistStore((s) => s.slugs);
  const synced = useWishlistStore((s) => s.syncedWithAccount);
  const [products, setProducts] = useState<ProductSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const key = slugs.join(",");

  useEffect(() => {
    if (!hydrated || !key) return;
    let cancelled = false;
    fetch(`/api/products?slugs=${encodeURIComponent(key)}&limit=60`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => !cancelled && setProducts(data.products))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [hydrated, key]);

  // Removing an item hides it immediately, without waiting for a refetch.
  const visible = products?.filter((p) => slugs.includes(p.slug)) ?? null;

  return (
    <div className="container-page py-8 sm:py-12">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-forest">Wishlist</p>
          <h1 className="mt-2 text-4xl text-ink">Saved for later</h1>
        </div>
        {hydrated && slugs.length > 0 && (
          <p className="text-sm text-muted">
            {synced ? "Synced to your account." : "Saved on this device. Sign in to keep it across devices."}
          </p>
        )}
      </header>

      <div className="mt-10">
        {!hydrated || (key && !visible && !failed) ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : failed ? (
          <ErrorState description="We couldn't load your wishlist. Please refresh the page." />
        ) : !key || !visible?.length ? (
          <EmptyState icon={Heart} title="Your wishlist is empty" description="Tap the heart on any gift to save it here for later." action={<ButtonLink href="/shop">Discover gifts</ButtonLink>} />
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            {visible.map((product) => (
              <li key={product.slug} className="flex">
                <ProductCard product={product} className="w-full" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
