import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, MapPin, Package, Settings } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { asLines, STATUS_LABELS, type ShippingAddress } from "@/lib/orders";
import { RecipientsManager } from "@/components/account/RecipientsManager";
import { SignOutButton } from "@/components/account/SignOutButton";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "My Account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/account");

  // Every query is scoped to the signed-in user — customers only ever see their own data.
  const [orders, recipients] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id, status: { notIn: ["CANCELLED"] } },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.recipient.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const nav = [
    { href: "#orders", label: "My orders", icon: Package },
    { href: "#recipients", label: "Saved recipients", icon: MapPin },
    { href: "/wishlist", label: "Wishlist", icon: Heart },
    { href: "#settings", label: "Account settings", icon: Settings },
  ];

  return (
    <div className="container-page py-8 sm:py-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-forest">My account</p>
          <h1 className="mt-2 text-4xl text-ink">Hello{user.name ? `, ${user.name}` : ""}.</h1>
          <p className="mt-1 text-sm text-muted">Signed in as {user.email}</p>
        </div>
        <SignOutButton />
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="Account" className="lg:sticky lg:top-36 lg:self-start">
          <ul className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
            {nav.map(({ href, label, icon: Icon }) => (
              <li key={href} className="shrink-0">
                <Link href={href} className="flex items-center gap-3 rounded-full border border-line bg-white px-4 py-2.5 text-sm text-ink hover:border-forest lg:rounded-xl">
                  <Icon size={16} className="text-forest" aria-hidden /> {label}
                </Link>
              </li>
            ))}
            <li className="shrink-0">
              <Link href="/track-order" className="flex items-center gap-3 rounded-full border border-line bg-white px-4 py-2.5 text-sm text-ink hover:border-forest lg:rounded-xl">
                <Package size={16} className="text-forest" aria-hidden /> Track an order
              </Link>
            </li>
          </ul>
        </nav>

        <div className="space-y-12">
          <section id="orders" aria-labelledby="orders-heading">
            <h2 id="orders-heading" className="text-2xl text-ink">My orders & gift history</h2>
            {orders.length === 0 ? (
              <div className="mt-5 rounded-3xl border border-dashed border-line p-8 text-center">
                <p className="text-muted">You haven&apos;t sent any gifts yet.</p>
                <ButtonLink href="/shop" className="mt-4">Find a gift</ButtonLink>
              </div>
            ) : (
              <ul className="mt-5 divide-y divide-line rounded-3xl border border-line bg-white">
                {orders.map((order) => {
                  const lines = asLines(order.items);
                  const to = order.shippingAddress as unknown as ShippingAddress | null;
                  return (
                    <li key={order.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-semibold text-ink">{order.orderNumber ?? order.id.slice(-8)}</span>
                          <span className="rounded-full bg-forest-soft px-2.5 py-0.5 text-xs text-forest">{STATUS_LABELS[order.status]}</span>
                        </p>
                        <p className="mt-1 truncate text-sm text-muted">
                          {lines.map((l) => l.name).join(", ") || "Gift order"}
                          {to?.firstName ? ` · for ${to.firstName}` : ""}
                        </p>
                        <p className="text-xs text-muted">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-ink">{formatMoney(order.total, order.currency)}</span>
                        <Link href={`/orders/${order.id}`} className="text-sm font-medium text-forest hover:underline">
                          View<span className="sr-only"> order {order.orderNumber}</span>
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section id="recipients" aria-labelledby="recipients-heading">
            <h2 id="recipients-heading" className="text-2xl text-ink">Saved recipients</h2>
            <p className="mt-1 text-sm text-muted">Save the people you send gifts to most — Mom, Dad, your partner — and check out faster.</p>
            <RecipientsManager
              initial={recipients.map((r) => ({
                id: r.id,
                nickname: r.nickname,
                firstName: r.firstName,
                lastName: r.lastName,
                city: r.city,
                country: r.country,
              }))}
            />
          </section>

          <section id="settings" aria-labelledby="settings-heading" className="rounded-3xl border border-line bg-white p-6">
            <h2 id="settings-heading" className="text-2xl text-ink">Account settings</h2>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-[8rem_1fr]">
              <dt className="text-muted">Email</dt>
              <dd className="text-ink">{user.email}</dd>
              <dt className="text-muted">Sign-in method</dt>
              <dd className="text-ink">Email and Password</dd>
            </dl>
            <p className="mt-4 text-xs text-muted">Need to change your email or delete your account? <Link href="/contact" className="text-forest hover:underline">Contact us</Link>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
