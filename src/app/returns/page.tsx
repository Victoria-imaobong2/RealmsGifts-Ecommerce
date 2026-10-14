import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Returns & Refunds",
  description: "How returns, replacements and refunds work at Realmsgifts.",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return (
    <InfoPage eyebrow="Returns" title="Returns & refunds" intro="If something isn't right with a gift, we want to hear about it." draft>
      <section>
        <h2>If there&apos;s a problem with your order</h2>
        <p>
          If a gift arrives damaged, incorrect or doesn&apos;t arrive, <Link href="/contact">contact us</Link> with your order number and, where possible,
          a photo. We&apos;ll review it with you and arrange a replacement or refund where appropriate.
        </p>
      </section>
      <section>
        <h2>Items that usually can&apos;t be returned</h2>
        <ul>
          <li>Perishable gifts such as flowers, cakes and food.</li>
          <li>Personalized or engraved items made to your specification.</li>
          <li>Opened beauty, fragrance and personal care products, for hygiene reasons.</li>
        </ul>
      </section>
      <section>
        <h2>Refunds</h2>
        <p>Approved refunds are returned to the original payment method. Processing times depend on your card issuer.</p>
      </section>
    </InfoPage>
  );
}
