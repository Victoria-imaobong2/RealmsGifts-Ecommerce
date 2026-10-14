"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Check, Gift, MapPin, PenLine } from "lucide-react";
import { getDestination, getMethodAvailability, GIFT_WRAP_FEE } from "@/config/delivery";
import type { Product } from "@/lib/catalog/types";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { useHydrated } from "@/lib/hooks";
import { useCartStore } from "@/store/useCartStore";
import { useDestinationStore } from "@/store/useDestinationStore";
import { useUiStore } from "@/store/useUiStore";
import { QuantityStepper } from "@/components/cart/CartLine";
import { Button } from "@/components/ui/Button";
import { WishlistButton } from "./WishlistButton";

type PurchaseProduct = Pick<
  Product,
  "id" | "slug" | "name" | "price" | "currency" | "images" | "options" | "personalization" | "stock" | "sameDayEligible" | "giftWrap"
>;

function DeliveryCheck({ product }: { product: PurchaseProduct }) {
  const hydrated = useHydrated();
  const { country, region } = useDestinationStore();
  const destination = getDestination(hydrated ? country : "US");
  if (!destination) return null;

  if (destination.status !== "available") {
    return (
      <p className="text-sm text-muted">
        We don&apos;t deliver to {destination.name} yet.{" "}
        <Link href="/delivery" className="text-forest underline-offset-4 hover:underline">See where we deliver</Link>
      </p>
    );
  }
  const methods = getMethodAvailability(destination.code, region || undefined, [product]);
  const cheapest = methods.filter((m) => m.available).sort((a, b) => a.method.price - b.method.price)[0];
  const sameDay = methods.find((m) => m.method.id === "same-day");

  return (
    <div className="space-y-1.5 text-sm">
      <p className="text-ink">
        Delivering to <strong className="font-semibold">{destination.name}</strong>
        {cheapest && <> · from {formatMoney(cheapest.method.price)}</>}
      </p>
      {sameDay && (
        <p className={sameDay.available ? "text-success" : "text-muted"}>
          {sameDay.available ? "Same-day delivery available for this item." : !product.sameDayEligible ? "Same-day delivery isn't available for this item." : sameDay.reason}
        </p>
      )}
      <p className="text-xs text-muted">
        Change destination on the{" "}
        <Link href="/#destination" className="underline-offset-4 hover:underline">home page</Link> or at checkout.
      </p>
    </div>
  );
}

export function PurchasePanel({ product }: { product: PurchaseProduct }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const openPanel = useUiStore((s) => s.open);
  const toast = useUiStore((s) => s.toast);
  const id = useId();

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [personalization, setPersonalization] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [added, setAdded] = useState(false);

  const missing = (product.options ?? []).filter((o) => !selected[o.name]).map((o) => o.name);
  const outOfStock = product.stock !== null && product.stock <= 0;

  const add = (): boolean => {
    if (missing.length) {
      setShowErrors(true);
      document.getElementById(`${id}-option-${missing[0]}`)?.focus();
      return false;
    }
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      currency: product.currency,
      image: product.images[0]?.src ?? "",
      options: selected,
      personalization: personalization.trim() || undefined,
      quantity,
      sameDayEligible: product.sameDayEligible,
    });
    return true;
  };

  return (
    <div className="space-y-7">
      {product.options?.map((option) => (
        <fieldset key={option.name}>
          <legend className="mb-3 flex items-baseline gap-2 text-sm font-medium text-ink">
            {option.name}
            {selected[option.name] && <span className="font-normal text-muted">{selected[option.name]}</span>}
          </legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-describedby={showErrors && !selected[option.name] ? `${id}-err-${option.name}` : undefined}>
            {option.values.map((value, index) => {
              const isSelected = selected[option.name] === value;
              return (
                <button
                  key={value}
                  id={index === 0 ? `${id}-option-${option.name}` : undefined}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelected((s) => ({ ...s, [option.name]: value }))}
                  className={cn(
                    "min-h-11 min-w-12 rounded-full border px-4 text-sm transition",
                    isSelected ? "border-forest bg-forest text-ivory" : "border-line bg-white text-ink hover:border-forest",
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
          {showErrors && !selected[option.name] && (
            <p id={`${id}-err-${option.name}`} className="mt-2 text-xs font-medium text-sale">
              Please choose a {option.name.toLowerCase()}.
            </p>
          )}
        </fieldset>
      ))}

      {product.personalization && (
        <div>
          <label htmlFor={`${id}-personal`} className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
            <PenLine size={16} className="text-forest" aria-hidden /> {product.personalization.label}
            <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id={`${id}-personal`}
            value={personalization}
            maxLength={product.personalization.maxLength}
            onChange={(e) => setPersonalization(e.target.value)}
            placeholder={product.personalization.placeholder}
            className="block w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15"
          />
          <p className="mt-1.5 text-xs text-muted">
            {personalization.length}/{product.personalization.maxLength} characters. We&apos;ll reproduce it exactly as typed.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper value={quantity} onChange={setQuantity} label={product.name} size="md" />
        <Button
          size="lg"
          className={cn("flex-1", added && "bg-success hover:bg-success")}
          disabled={outOfStock}
          onClick={() => {
            if (!add()) return;
            setAdded(true);
            setTimeout(() => setAdded(false), 1600);
            toast(`${product.name} added to your bag`);
            openPanel("cart");
          }}
        >
          {outOfStock ? "Out of stock" : added ? (<><Check size={16} aria-hidden /> Added to bag</>) : "Add to bag"}
        </Button>
        <WishlistButton slug={product.slug} name={product.name} variant="inline" />
      </div>
      {!outOfStock && (
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={() => {
            if (add()) router.push("/checkout");
          }}
        >
          Buy now
        </Button>
      )}

      <div className="space-y-4 rounded-2xl border border-line bg-white p-5">
        <div className="flex gap-3">
          <MapPin size={18} className="mt-0.5 shrink-0 text-forest" aria-hidden />
          <DeliveryCheck product={product} />
        </div>
        <div className="flex gap-3 border-t border-line pt-4 text-sm">
          <Gift size={18} className="mt-0.5 shrink-0 text-forest" aria-hidden />
          <p className="text-ink">
            Add a gift message at checkout{product.giftWrap ? <>, plus gift wrapping for {formatMoney(GIFT_WRAP_FEE)}</> : null}. Prices
            can be hidden from the recipient.
          </p>
        </div>
      </div>
    </div>
  );
}
