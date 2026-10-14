import type { Metadata } from "next";
import { ShopView } from "@/components/shop/ShopView";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const query = Array.isArray(q) ? q[0] : q;
  return {
    title: query ? `Search results for “${query}”` : "Shop All Gifts",
    description: "Shop thoughtful gifts for every occasion — flowers, cakes, jewelry, fragrances, gift boxes and more, priced in USD.",
    alternates: { canonical: "/shop" },
    robots: query ? { index: false, follow: true } : undefined,
  };
}

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = Array.isArray(params.q) ? params.q[0] : params.q;
  return (
    <ShopView
      title={q ? `Results for “${q}”` : "All gifts"}
      description={q ? undefined : "Beautiful, meaningful gifts for birthdays, anniversaries and all the little moments in between."}
      eyebrow={q ? "Search" : "Shop"}
      basePath="/shop"
      searchParams={params}
      breadcrumbs={[{ href: "/", label: "Home" }, { label: q ? "Search" : "Shop" }]}
    />
  );
}
