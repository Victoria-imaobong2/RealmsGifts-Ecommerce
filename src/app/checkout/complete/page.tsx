import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { isDatabaseConfigured } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { asLines, syncPaymentFromPaystack, type PaymentOutcome } from "@/lib/orders";
import { ButtonLink } from "@/components/ui/Button";
import { ClearCart } from "./ClearCart";

export const metadata: Metadata = { title: "Order status", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function Shell({ icon, tone, eyebrow, title, children }: { icon: React.ReactNode; tone: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="container-page max-w-2xl py-14 text-center sm:py-20">
      <div className={`mx-auto flex h-16 w-16 items-center justify-center ${tone}`}>{icon}</div>
      <p className="eyebrow mt-6 text-forest">{eyebrow}</p>
      <h1 className="mt-3 text-4xl leading-tight text-ink sm:text-5xl">{title}</h1>
      {children}
    </div>
  );
}

function Reference({ orderNumber, reference }: { orderNumber?: string | null; reference: string }) {
  return (
    <dl className="mx-auto mt-6 inline-grid grid-cols-[auto_auto] gap-x-4 gap-y-1 rounded-2xl bg-white px-5 py-3 text-left text-sm ring-1 ring-line">
      {orderNumber && (
        <>
          <dt className="text-muted">Order number</dt>
          <dd className="font-semibold text-ink">{orderNumber}</dd>
        </>
      )}
      <dt className="text-muted">Payment reference</dt>
      <dd className="break-all font-mono text-xs text-ink">{reference}</dd>
    </dl>
  );
}

/**
 * Paystack returns the customer here after paying (callback_url) or after
 * pressing Cancel (cancel_action). Nothing in the URL is trusted: the outcome
 * comes from verifying the reference with Paystack on the server.
 */
export default async function CheckoutCompletePage({ searchParams }: Props) {
  const params = await searchParams;
  const reference = first(params.reference) || first(params.trxref);
  const customerCancelled = first(params.cancelled) === "1";

  let outcome: PaymentOutcome = "not_found";
  let order = null;
  if (/^[A-Za-z0-9.=-]{6,100}$/.test(reference) && isDatabaseConfigured()) {
    try {
      ({ outcome, order } = await syncPaymentFromPaystack(reference, { via: "return from checkout", customerCancelled }));
    } catch (error) {
      console.error("[checkout/complete] Verification error:", error instanceof Error ? error.message : "unknown");
      outcome = "unverified";
    }
  }

  if (outcome === "paid" && order) {
    const lines = asLines(order.items);
    return (
      <Shell icon={<CheckCircle2 size={56} strokeWidth={1.4} aria-hidden />} tone="text-success" eyebrow="Payment confirmed" title="Thank you — your gift is on its way to being special.">
        <ClearCart />
        <p className="mt-4 text-muted">
          We&apos;ve sent a confirmation to <strong className="font-semibold text-ink">{order.email}</strong>.
        </p>
        <Reference orderNumber={order.orderNumber} reference={reference} />
        <div className="mt-8 rounded-3xl border border-line bg-white p-6 text-left">
          <ul className="space-y-2 text-sm">
            {lines.map((line, index) => (
              <li key={`${line.slug}-${index}`} className="flex justify-between gap-4">
                <span className="text-ink">{line.name} × {line.quantity}</span>
                <span className="text-muted">{formatMoney(line.unitPrice * line.quantity)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex justify-between border-t border-line pt-4 font-semibold text-ink">
            <span>Total paid</span>
            <span>{formatMoney(order.total, order.currency)}</span>
          </p>
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href={`/track-order?order=${order.orderNumber}`}>Track your order</ButtonLink>
          <ButtonLink href="/shop" variant="secondary">Continue shopping</ButtonLink>
        </div>
      </Shell>
    );
  }

  if (outcome === "cancelled") {
    return (
      <Shell icon={<XCircle size={52} strokeWidth={1.4} aria-hidden />} tone="text-muted" eyebrow="Payment cancelled" title="No problem — nothing was charged.">
        <p className="mt-4 text-muted">You cancelled before paying, so this order wasn&apos;t placed. Your bag is still saved whenever you&apos;re ready.</p>
        <Reference orderNumber={order?.orderNumber} reference={reference} />
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/checkout">Return to checkout</ButtonLink>
          <ButtonLink href="/cart" variant="secondary">View bag</ButtonLink>
        </div>
      </Shell>
    );
  }

  if (outcome === "failed") {
    return (
      <Shell icon={<XCircle size={52} strokeWidth={1.4} aria-hidden />} tone="text-sale" eyebrow="Payment unsuccessful" title="Your payment didn't go through.">
        <p className="mt-4 text-muted">
          Your bank or card provider declined the payment, and the order wasn&apos;t placed. Your bag is still saved — you can try again with the same or a different card.
        </p>
        <Reference orderNumber={order?.orderNumber} reference={reference} />
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/checkout">Try again</ButtonLink>
          <ButtonLink href="/contact" variant="secondary">Contact us</ButtonLink>
        </div>
      </Shell>
    );
  }

  if (outcome === "pending" || outcome === "unverified") {
    return (
      <Shell icon={<Clock size={52} strokeWidth={1.4} aria-hidden />} tone="text-gold" eyebrow="Processing" title="We're confirming your payment.">
        <p className="mt-4 text-muted">
          {outcome === "unverified"
            ? "We couldn't reach our payment provider just now. If you completed payment, it will be confirmed automatically — please check again in a moment."
            : "Your payment hasn't been confirmed yet. If you just paid, this can take a moment. If you left Paystack without paying, you can return to checkout."}
        </p>
        <Reference orderNumber={order?.orderNumber} reference={reference} />
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href={`/checkout/complete?reference=${encodeURIComponent(reference)}`}>Check again</ButtonLink>
          <ButtonLink href="/checkout" variant="secondary">Return to checkout</ButtonLink>
        </div>
      </Shell>
    );
  }

  if (outcome === "mismatch") {
    return (
      <Shell icon={<AlertTriangle size={52} strokeWidth={1.4} aria-hidden />} tone="text-sale" eyebrow="Needs review" title="We need to check this payment.">
        <p className="mt-4 text-muted">
          The payment we received doesn&apos;t match your order total, so we haven&apos;t confirmed it yet. Our team will review it — please contact us with the reference below.
        </p>
        <Reference orderNumber={order?.orderNumber} reference={reference} />
        <div className="mt-8">
          <ButtonLink href="/contact">Contact us</ButtonLink>
        </div>
      </Shell>
    );
  }

  return (
    <Shell icon={<AlertTriangle size={52} strokeWidth={1.4} aria-hidden />} tone="text-muted" eyebrow="Order status" title="We couldn't find that payment.">
      <p className="mt-4 text-muted">
        This link doesn&apos;t match a payment in our records. If you were charged, please contact us with your email address and we&apos;ll sort it out right away.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href="/checkout">Return to checkout</ButtonLink>
        <Link href="/contact" className="inline-flex h-11 items-center justify-center px-6 text-sm font-semibold text-forest hover:underline">
          Contact us
        </Link>
      </div>
    </Shell>
  );
}
