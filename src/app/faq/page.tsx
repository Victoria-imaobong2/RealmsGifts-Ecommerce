import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { AVAILABLE_DESTINATIONS, DESTINATIONS, GIFT_WRAP_FEE } from "@/config/delivery";
import { formatMoney } from "@/lib/format";
import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers about ordering, delivery, payment, gift messages and tracking at Realmsgifts.",
  alternates: { canonical: "/faq" },
};

const comingSoon = DESTINATIONS.filter((d) => d.status === "coming-soon").map((d) => d.name);

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Where do you deliver?",
    a: (
      <>
        We currently deliver to {AVAILABLE_DESTINATIONS.map((d) => d.name).join(" and ")}.{" "}
        {comingSoon.length > 0 && <>{comingSoon.join(", ")} are coming soon. </>}
        See <Link href="/delivery">delivery information</Link> for options and prices.
      </>
    ),
  },
  { q: "What currency are prices in?", a: "All prices are shown and charged in US dollars (USD)." },
  { q: "How do I pay?", a: "Checkout is processed securely by Paystack. We never see or store your card details." },
  {
    q: "Can I include a personal message?",
    a: `Yes — add a gift message and your name at checkout, free of charge. Gift wrapping is ${formatMoney(GIFT_WRAP_FEE)} per order, and you can hide prices from the recipient.`,
  },
  {
    q: "How do I track my order?",
    a: (
      <>
        Visit <Link href="/track-order">Track Order</Link> and enter your order number (from your confirmation email) and the email you used at checkout.
      </>
    ),
  },
  { q: "Do I need an account to order?", a: "No. You can check out as a guest. An account lets you save recipients, sync your wishlist and see your order history." },
  { q: "Is sales tax included?", a: "Sales tax isn't currently calculated or charged at checkout. Your order summary always shows exactly what you'll pay." },
  {
    q: "Can I return a gift?",
    a: (
      <>
        Because many gifts are perishable or personalized, returns depend on the item. See our <Link href="/returns">returns page</Link> or contact us.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <InfoPage eyebrow="FAQs" title="Frequently asked questions">
      <div className="divide-y divide-line border-y border-line">
        {FAQS.map(({ q, a }) => (
          <details key={q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg text-ink [&::-webkit-details-marker]:hidden">
              {q}
              <ChevronDown size={18} className="shrink-0 text-muted transition group-open:rotate-180" aria-hidden />
            </summary>
            <div className="pb-5">{a}</div>
          </details>
        ))}
      </div>
    </InfoPage>
  );
}
