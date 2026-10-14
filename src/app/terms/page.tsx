import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you shop with Realmsgifts.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <InfoPage eyebrow="Terms" title="Terms of service" draft>
      <section>
        <h2>Orders and pricing</h2>
        <p>All prices are in US dollars. An order is confirmed once payment has been verified, and you&apos;ll receive a confirmation email with your order number.</p>
      </section>
      <section>
        <h2>Delivery</h2>
        <p>
          Delivery options depend on the destination and the items ordered. Dates shown before checkout are estimates; see{" "}
          <Link href="/delivery">delivery information</Link>.
        </p>
      </section>
      <section>
        <h2>Product images</h2>
        <p>Products are photographed to represent them as closely as possible. Natural items such as flowers and baked goods vary by season and batch.</p>
      </section>
      <section>
        <h2>Questions</h2>
        <p>
          <Link href="/contact">Contact us</Link> about anything in these terms.
        </p>
      </section>
    </InfoPage>
  );
}
