import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDestination } from "@/config/delivery";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { asLines, STATUS_LABELS, type GiftDetails, type ShippingAddress } from "@/lib/orders";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { SafeImage } from "@/components/product/SafeImage";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Full order details (including the recipient's address) are only shown to
 * the signed-in customer who owns the order, or to staff. Everyone else is
 * sent to the verified Track Order lookup.
 */
export default async function OrderStatusPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  if (!isDatabaseConfigured()) notFound();

  const [user, staff] = await Promise.all([getCurrentUser(), isAdmin()]);
  if (!user && !staff) redirect(`/login?redirect=${encodeURIComponent(`/orders/${id}`)}`);

  const order = await prisma.order.findUnique({
    where: { id },
    include: { events: { orderBy: { createdAt: "asc" } } },
  });
  if (!order || (!staff && order.userId !== user?.id)) notFound();

  const lines = asLines(order.items);
  const address = order.shippingAddress as unknown as ShippingAddress | null;
  const gift = order.gift as unknown as GiftDetails | null;

  return (
    <div className="container-page max-w-4xl py-8 sm:py-12">
      <Link href="/account#orders" className="text-sm text-muted hover:text-forest">← Back to my orders</Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-forest">Order</p>
          <h1 className="mt-1 text-4xl text-ink">{order.orderNumber ?? order.id.slice(-8)}</h1>
          <p className="mt-1 text-sm text-muted">Placed {formatDate(order.createdAt)}</p>
        </div>
        <span className="rounded-full bg-forest-soft px-4 py-1.5 text-sm font-medium text-forest">{STATUS_LABELS[order.status]}</span>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <section className="rounded-3xl border border-line bg-white p-6">
          <h2 className="text-xl text-ink">Progress</h2>
          <div className="mt-5">
            <OrderTimeline status={order.status} events={order.events} />
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-line bg-white p-6">
            <h2 className="text-xl text-ink">Items</h2>
            <ul className="mt-4 space-y-3">
              {lines.map((line, index) => (
                <li key={`${line.slug}-${index}`} className="flex items-center gap-3 text-sm">
                  <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-cream">
                    {line.image && <SafeImage src={line.image} alt="" fill sizes="48px" className="object-cover" />}
                  </span>
                  <span className="flex-1">
                    <span className="block text-ink">{line.name} × {line.quantity}</span>
                    {Object.values(line.options).length > 0 && <span className="text-xs text-muted">{Object.values(line.options).join(" · ")}</span>}
                    {line.personalization && <span className="block text-xs italic text-muted">“{line.personalization}”</span>}
                  </span>
                  <span className="text-ink">{formatMoney(line.unitPrice * line.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm">
              {order.subtotal != null && <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatMoney(order.subtotal)}</dd></div>}
              {order.shippingFee != null && <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{formatMoney(order.shippingFee)}</dd></div>}
              {!!order.giftWrapFee && <div className="flex justify-between"><dt className="text-muted">Gift wrapping</dt><dd>{formatMoney(order.giftWrapFee)}</dd></div>}
              <div className="flex justify-between font-semibold text-ink"><dt>Total</dt><dd>{formatMoney(order.total, order.currency)}</dd></div>
            </dl>
          </section>

          {address && (
            <section className="rounded-3xl border border-line bg-white p-6 text-sm">
              <h2 className="text-xl text-ink">Delivering to</h2>
              <address className="mt-3 not-italic leading-relaxed text-muted">
                <span className="text-ink">{address.firstName} {address.lastName}</span>
                <br />
                {address.line1}
                {address.line2 && <>, {address.line2}</>}
                <br />
                {address.city}
                {address.region && `, ${getDestination(address.country)?.regions?.find((r) => r.code === address.region)?.name ?? address.region}`}
                {address.postalCode && ` ${address.postalCode}`}
                <br />
                {getDestination(address.country)?.name ?? address.country}
              </address>
              {order.deliveryDate && <p className="mt-3 text-muted">Scheduled for {formatDate(order.deliveryDate, { weekday: "long", month: "long", day: "numeric" })}</p>}
              {gift?.message && (
                <div className="mt-4 rounded-2xl bg-cream/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Gift message</p>
                  <p className="mt-1 font-serif text-base italic text-ink">“{gift.message}”</p>
                  {gift.senderName && <p className="mt-1 text-muted">— {gift.senderName}</p>}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
