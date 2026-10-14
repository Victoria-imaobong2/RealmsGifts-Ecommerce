import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RECIPIENTS, getRecipient } from "@/lib/catalog/taxonomy";
import { ShopView } from "@/components/shop/ShopView";

// Served at /gifts-for-<recipient> via a rewrite in next.config.ts.
type Props = {
  params: Promise<{ recipient: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  return RECIPIENTS.map((r) => ({ recipient: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const recipient = getRecipient((await params).recipient);
  if (!recipient) return {};
  return {
    title: recipient.label,
    description: `Thoughtful ${recipient.label.toLowerCase()} — curated ideas for every occasion and budget, from Realmsgifts.`,
    alternates: { canonical: `/gifts-for-${recipient.slug}` },
  };
}

export default async function RecipientPage({ params, searchParams }: Props) {
  const recipient = getRecipient((await params).recipient);
  if (!recipient) notFound();
  return (
    <ShopView
      title={recipient.label}
      description="Thoughtfully chosen ideas they'll love, for every occasion and budget."
      eyebrow="Shop by recipient"
      basePath={`/gifts-for-${recipient.slug}`}
      searchParams={await searchParams}
      fixed={{ key: "recipient", value: recipient.slug }}
      breadcrumbs={[{ href: "/", label: "Home" }, { href: "/recipients", label: "Recipients" }, { label: recipient.label }]}
    />
  );
}
