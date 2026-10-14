import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIES, getCategory } from "@/lib/catalog/taxonomy";
import { ShopView } from "@/components/shop/ShopView";

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = getCategory((await params).category);
  if (!category) return {};
  return {
    title: category.name,
    description: `${category.description} Thoughtful ${category.name.toLowerCase()} gifts, priced in USD, from Realmsgifts.`,
    alternates: { canonical: `/shop/${category.slug}` },
    openGraph: { images: [{ url: `${category.image.src}?auto=format&fit=crop&w=1200&h=630&q=75`, alt: category.image.alt }] },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = getCategory((await params).category);
  if (!category) notFound();
  return (
    <ShopView
      title={category.name}
      description={category.description}
      eyebrow="Category"
      basePath={`/shop/${category.slug}`}
      searchParams={await searchParams}
      fixed={{ key: "category", value: category.slug }}
      breadcrumbs={[{ href: "/", label: "Home" }, { href: "/categories", label: "Categories" }, { label: category.name }]}
    />
  );
}
