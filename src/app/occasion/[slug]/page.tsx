import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OCCASIONS, getOccasion } from "@/lib/catalog/taxonomy";
import { ShopView } from "@/components/shop/ShopView";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  return OCCASIONS.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const occasion = getOccasion((await params).slug);
  if (!occasion) return {};
  return {
    title: `${occasion.name} Gifts`,
    description: `${occasion.description} Shop ${occasion.name.toLowerCase()} gifts and send them to someone you love.`,
    alternates: { canonical: `/occasion/${occasion.slug}` },
    openGraph: { images: [{ url: `${occasion.image.src}?auto=format&fit=crop&w=1200&h=630&q=75`, alt: occasion.image.alt }] },
  };
}

export default async function OccasionPage({ params, searchParams }: Props) {
  const occasion = getOccasion((await params).slug);
  if (!occasion) notFound();
  return (
    <ShopView
      title={`${occasion.name} gifts`}
      description={occasion.description}
      eyebrow="Occasion"
      basePath={`/occasion/${occasion.slug}`}
      searchParams={await searchParams}
      fixed={{ key: "occasion", value: occasion.slug }}
      breadcrumbs={[{ href: "/", label: "Home" }, { href: "/occasions", label: "Occasions" }, { label: occasion.name }]}
    />
  );
}
