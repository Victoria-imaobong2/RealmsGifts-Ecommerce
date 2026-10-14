import type { Metadata } from "next";
import { OCCASIONS } from "@/lib/catalog/taxonomy";
import { OccasionCard } from "@/components/catalog/Cards";
import { Breadcrumbs } from "@/components/shop/ShopView";
import { SectionHeading } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Shop by Occasion",
  description: "Birthday, anniversary, graduation, new baby, thank you and more — find the right gift for every occasion.",
  alternates: { canonical: "/occasions" },
};

export default function OccasionsPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Occasions" }]} />
      <SectionHeading as="h1" className="mt-5" eyebrow="Occasions" title="Shop by occasion" description="For the big days, the small wins, and every moment in between." />
      <ul className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {OCCASIONS.map((occasion) => (
          <li key={occasion.slug} className="reveal">
            <OccasionCard occasion={occasion} />
          </li>
        ))}
      </ul>
    </div>
  );
}
