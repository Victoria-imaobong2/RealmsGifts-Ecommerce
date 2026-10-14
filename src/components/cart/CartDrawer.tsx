"use client";

import Link from "next/link";
import { useRef } from "react";
import { ShoppingBag, X } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useDialog } from "@/lib/hooks";
import { cartCount, cartSubtotal, useCartStore } from "@/store/useCartStore";
import { useUiStore } from "@/store/useUiStore";
import { buttonClasses } from "@/components/ui/Button";
import { CartLine } from "./CartLine";

export function CartDrawer() {
  const open = useUiStore((s) => s.panel === "cart");
  const close = useUiStore((s) => s.close);
  const items = useCartStore((s) => s.items);
  const panelRef = useRef<HTMLDivElement>(null);
  useDialog(open, close, panelRef);

  if (!open) return null;
  const count = cartCount(items);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-forest-dark/40" onClick={close} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-in-right flex-col bg-ivory shadow-[var(--shadow-overlay)]"
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <h2 id="cart-title" className="text-xl text-ink">
            Your bag {count > 0 && <span className="font-sans text-sm text-muted">({count})</span>}
          </h2>
          <button type="button" onClick={close} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-cream" aria-label="Close bag">
            <X size={22} aria-hidden />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream text-forest">
              <ShoppingBag size={26} strokeWidth={1.5} aria-hidden />
            </div>
            <p className="font-serif text-2xl text-ink">Your bag is empty</p>
            <p className="mt-2 text-sm text-muted">Let&apos;s find something they&apos;ll love.</p>
            <Link href="/shop" onClick={close} className={buttonClasses({ className: "mt-6" })}>
              Shop gifts
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((item) => (
                <CartLine key={item.lineId} item={item} onNavigate={close} compact />
              ))}
            </ul>
            <div className="space-y-3 border-t border-line bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted">Subtotal</span>
                <span className="text-lg font-semibold text-ink">{formatMoney(cartSubtotal(items))}</span>
              </div>
              <p className="text-xs text-muted">Delivery and gift options are added at checkout.</p>
              <Link href="/checkout" onClick={close} className={buttonClasses({ size: "lg", className: "w-full" })}>
                Proceed to checkout
              </Link>
              <Link href="/cart" onClick={close} className="block text-center text-sm font-medium text-forest hover:underline">
                View full bag
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
