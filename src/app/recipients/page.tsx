import type { Metadata } from "next";
import { RECIPIENTS } from "@/lib/catalog/taxonomy";
import { RecipientCard } from "@/components/catalog/Cards";
import { Breadcrumbs } from "@/components/shop/ShopView";
import { SectionHeading } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Shop by Recipient",
  description: "Gifts for her, him, mom, dad, partners, friends, coworkers, kids and the whole family.",
  alternates: { canonical: "/recipients" },
};

export default function RecipientsPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Recipients" }]} />
      <SectionHeading as="h1" className="mt-5" eyebrow="Recipients" title="Who are you shopping for?" />
      <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
        {RECIPIENTS.map((recipient) => (
          <li key={recipient.slug}>
            <RecipientCard recipient={recipient} />
          </li>
        ))}
      </ul>
    </div>
  );
}
