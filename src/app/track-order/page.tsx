import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shop/ShopView";
import { TrackOrderForm } from "./TrackOrderForm";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Track your Realmsgifts order with your order number and email address.",
  alternates: { canonical: "/track-order" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function TrackOrderPage({ searchParams }: Props) {
  const { order } = await searchParams;
  const initial = Array.isArray(order) ? order[0] : order;
  return (
    <div className="container-page py-8 sm:py-12">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Track order" }]} />
      <header className="mb-10 mt-5 max-w-2xl">
        <p className="eyebrow text-forest">Track order</p>
        <h1 className="mt-2 text-4xl text-ink sm:text-5xl">Where&apos;s my gift?</h1>
        <p className="mt-3 text-muted">Follow your order from our hands to theirs.</p>
      </header>
      <TrackOrderForm initialOrder={initial?.slice(0, 20)} />
    </div>
  );
}
