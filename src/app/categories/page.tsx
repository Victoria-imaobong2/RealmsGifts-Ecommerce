import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/catalog/taxonomy";
import { CategoryCard } from "@/components/catalog/Cards";
import { Breadcrumbs } from "@/components/shop/ShopView";
import { SectionHeading } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Gift Categories",
  description: "Browse every Realmsgifts gift category — flowers, cakes, chocolates, jewelry, fragrances, gift boxes and more.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const catalog = await getCatalog();
  const counts = new Map<string, number>();
  for (const product of catalog) counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
  return (
    <div className="container-page py-8 sm:py-12">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Categories" }]} />
      <SectionHeading as="h1" className="mt-5" eyebrow="Categories" title="Find something they'll love." description="Every category, beautifully organized." />
      <ul className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((category) => (
          <li key={category.slug} className="reveal">
            <CategoryCard category={category} count={counts.get(category.slug)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
