"use client";

import Image from "next/image";
import { useState } from "react";
import { PackageSearch } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { formatDate } from "@/lib/format";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { Alert, Field, Input } from "@/components/ui/primitives";
import { SafeImage } from "@/components/product/SafeImage";

interface TrackResult {
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  createdAt: string;
  deliveryType: string;
  deliveryDate: string | null;
  items: { name: string; quantity: number; image: string }[];
  events: { status: OrderStatus; createdAt: string }[];
  proofOfDelivery: string | null;
}

export function TrackOrderForm({ initialOrder }: { initialOrder?: string }) {
  const [orderNumber, setOrderNumber] = useState(initialOrder ?? "");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{ status: "idle" | "loading" | "error"; message?: string }>({ status: "idle" });
  const [result, setResult] = useState<TrackResult | null>(null);

  return (
    <div className="grid gap-8 lg:grid-cols-[22rem_1fr]">
      <form
        className="h-fit space-y-4 rounded-3xl border border-line bg-white p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setState({ status: "loading" });
          setResult(null);
          try {
            const res = await fetch("/api/orders/track", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderNumber, email }),
            });
            const data = await res.json();
            if (!res.ok) {
              setState({ status: "error", message: data.error });
              return;
            }
            setResult(data);
            setState({ status: "idle" });
          } catch {
            setState({ status: "error", message: "We couldn't connect. Please try again." });
          }
        }}
      >
        <Field label="Order number" htmlFor="track-order" hint="Found in your confirmation email, e.g. RG-7KX29QPD.">
          <Input id="track-order" required autoComplete="off" autoCapitalize="characters" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="RG-XXXXXXXX" />
        </Field>
        <Field label="Email used at checkout" htmlFor="track-email">
          <Input id="track-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        {state.status === "error" && <Alert tone="error">{state.message}</Alert>}
        <button type="submit" disabled={state.status === "loading"} className="h-12 w-full rounded-full bg-forest text-sm font-semibold text-ivory transition hover:bg-forest-dark disabled:opacity-60">
          {state.status === "loading" ? "Looking up your order…" : "Track order"}
        </button>
        <p className="text-xs text-muted">For your privacy we only show order progress here — never addresses or payment details.</p>
      </form>

      <div aria-live="polite">
        {result ? (
          <div className="rounded-3xl border border-line bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-5">
              <div>
                <p className="eyebrow text-muted">Order</p>
                <h2 className="mt-1 text-2xl text-ink">{result.orderNumber}</h2>
                <p className="mt-1 text-sm text-muted">Placed {formatDate(result.createdAt)}</p>
              </div>
              <span className="rounded-full bg-forest-soft px-4 py-1.5 text-sm font-medium text-forest">{result.statusLabel}</span>
            </div>
            <div className="mt-6 grid gap-8 md:grid-cols-2">
              <OrderTimeline status={result.status} events={result.events} />
              <div>
                <p className="text-sm font-medium text-ink">In this order</p>
                <ul className="mt-3 space-y-3">
                  {result.items.map((item, index) => (
                    <li key={`${item.name}-${index}`} className="flex items-center gap-3 text-sm">
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cream">
                        {item.image && <SafeImage src={item.image} alt="" fill sizes="48px" className="object-cover" />}
                      </span>
                      {item.name} × {item.quantity}
                    </li>
                  ))}
                </ul>
                {result.deliveryDate && <p className="mt-5 text-sm text-muted">Scheduled for {formatDate(result.deliveryDate, { weekday: "long", month: "long", day: "numeric" })}</p>}
                {result.proofOfDelivery && (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-ink">Proof of delivery</p>
                    <Image src={result.proofOfDelivery} alt="Recipient signature captured at delivery" width={320} height={128} unoptimized className="mt-2 rounded-xl border border-line bg-white" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-line p-8 text-center">
            <PackageSearch size={36} strokeWidth={1.4} className="text-forest" aria-hidden />
            <p className="mt-4 font-serif text-xl text-ink">Your order&apos;s journey will appear here</p>
            <p className="mt-1 text-sm text-muted">Enter your order number and email to see its progress.</p>
          </div>
        )}
      </div>
    </div>
  );
}
