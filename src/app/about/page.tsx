import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AVAILABLE_DESTINATIONS } from "@/config/delivery";
import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "About Realmsgifts",
  description: "Realmsgifts helps you send thoughtful gifts to the people you love — whether they're across town or across the world.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="Our story"
      title="Gifts that close the distance."
      intro="Realmsgifts began with a simple idea: the people we love most aren't always nearby, but the moments that matter still deserve to be celebrated properly."
    >
      <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-cream">
        <Image src="https://images.unsplash.com/photo-1625552187571-7ee60ac43d2b" alt="Two hands exchanging a wrapped gift" fill sizes="(min-width: 768px) 48rem, 100vw" className="object-cover" />
      </div>
      <section>
        <h2>What we do</h2>
        <p>
          We curate beautiful, meaningful gifts — flowers, cakes, jewelry, fragrances, keepsakes and more — and deliver them with your
          personal message. Shop in US dollars, pay securely, and send your gift anywhere in the{" "}
          {AVAILABLE_DESTINATIONS.map((d) => d.name).join(" or the ")}, with more destinations on the way.
        </p>
      </section>
      <section>
        <h2>What we believe</h2>
        <ul>
          <li><strong>Thoughtfulness over volume.</strong> A smaller, considered collection beats endless aisles.</li>
          <li><strong>Honesty.</strong> Clear prices in USD, clear delivery options, and no made-up reviews or countdown pressure.</li>
          <li><strong>Connection.</strong> Every gift carries a story — we&apos;re here to help you tell it.</li>
        </ul>
      </section>
      <section>
        <h2>Work with us</h2>
        <p>
          Are you a florist, baker or maker who&apos;d like to partner with Realmsgifts? <Link href="/contact?topic=partner">Get in touch</Link>.
        </p>
      </section>
    </InfoPage>
  );
}
