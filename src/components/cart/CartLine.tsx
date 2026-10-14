"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { MAX_QUANTITY } from "@/lib/pricing";
import { useCartStore, type CartItem } from "@/store/useCartStore";
import { SafeImage } from "@/components/product/SafeImage";

export function QuantityStepper({
  value,
  onChange,
  label,
  size = "sm",
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  size?: "sm" | "md";
}) {
  const box = size === "md" ? "h-12 w-12" : "h-9 w-9";
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-white" role="group" aria-label={`Quantity for ${label}`}>
      <button type="button" className={cn(box, "flex items-center justify-center rounded-full text-ink hover:bg-cream disabled:opacity-40")} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        <Minus size={14} aria-hidden />
      </button>
      <span className="min-w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" className={cn(box, "flex items-center justify-center rounded-full text-ink hover:bg-cream disabled:opacity-40")} onClick={() => onChange(value + 1)} disabled={value >= MAX_QUANTITY} aria-label="Increase quantity">
        <Plus size={14} aria-hidden />
      </button>
    </div>
  );
}

export function CartLine({ item, onNavigate, compact = false }: { item: CartItem; onNavigate?: () => void; compact?: boolean }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const lastAdded = useCartStore((s) => s.lastAdded);
  const options = Object.entries(item.options);

  return (
    <li className={cn("flex gap-4 py-5", lastAdded === item.lineId && "motion-safe:animate-fade-up")}>
      <Link href={`/product/${item.slug}`} onClick={onNavigate} className={cn("relative shrink-0 overflow-hidden rounded-xl bg-cream", compact ? "h-24 w-20" : "h-32 w-26")}>
        {item.image && <SafeImage src={item.image} alt={item.name} fill sizes="104px" className="object-cover" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/product/${item.slug}`} onClick={onNavigate} className="text-[15px] font-medium leading-snug text-ink hover:text-forest">
              {item.name}
            </Link>
            {options.length > 0 && (
              <p className="mt-1 text-xs text-muted">{options.map(([k, v]) => `${k}: ${v}`).join(" · ")}</p>
            )}
            {item.personalization && <p className="mt-1 text-xs italic text-muted">“{item.personalization}”</p>}
            <p className="mt-1 text-xs text-muted">{formatMoney(item.price, item.currency)} each</p>
          </div>
          <p className="text-[15px] font-semibold text-ink">{formatMoney(item.price * item.quantity, item.currency)}</p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <QuantityStepper value={item.quantity} onChange={(q) => updateQuantity(item.lineId, q)} label={item.name} />
          <button type="button" onClick={() => removeItem(item.lineId)} className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs text-muted transition hover:text-sale">
            <Trash2 size={14} aria-hidden /> Remove<span className="sr-only"> {item.name}</span>
          </button>
        </div>
      </div>
    </li>
  );
}
