"use client";

import Link from "next/link";
import { Lock, ShoppingBag } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useHydrated } from "@/lib/hooks";
import { cartCount, cartSubtotal, useCartStore } from "@/store/useCartStore";
import { CartLine } from "@/components/cart/CartLine";
import { ButtonLink, buttonClasses } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/primitives";

export default function CartPage() {
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  if (!hydrated) {
    return (
      <div className="container-page py-12">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-8 h-40 w-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          description="Looks like you haven't added anything yet. Let's find something they'll love."
          action={<ButtonLink href="/shop">Shop gifts</ButtonLink>}
        />
      </div>
    );
  }

  const subtotal = cartSubtotal(items);

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-4xl text-ink">
          Your bag <span className="font-sans text-base text-muted">({cartCount(items)} items)</span>
        </h1>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Remove all items from your bag?")) clearCart();
          }}
          className="text-sm text-muted underline-offset-4 hover:text-sale hover:underline"
        >
          Clear bag
        </button>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_24rem]">
        <ul className="divide-y divide-line border-y border-line">
          {items.map((item) => (
            <CartLine key={item.lineId} item={item} />
          ))}
        </ul>

        <aside aria-label="Order summary" className="h-fit rounded-3xl border border-line bg-white p-6 lg:sticky lg:top-36">
          <h2 className="text-2xl text-ink">Order summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-medium text-ink">{formatMoney(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd className="text-muted">Calculated at checkout</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Gift wrap & message</dt>
              <dd className="text-muted">Added at checkout</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <dt className="font-semibold text-ink">Estimated total</dt>
              <dd className="font-semibold text-ink">{formatMoney(subtotal)}</dd>
            </div>
          </dl>
          <Link href="/checkout" className={buttonClasses({ size: "lg", className: "mt-6 w-full" })}>
            Proceed to checkout
          </Link>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
            <Lock size={13} aria-hidden /> Secure checkout powered by Paystack
          </p>
          <Link href="/shop" className="mt-4 block text-center text-sm font-medium text-forest hover:underline">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
