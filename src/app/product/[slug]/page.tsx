import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { DELIVERY_RATES_CONFIRMED, AVAILABLE_DESTINATIONS } from "@/config/delivery";
import { SITE } from "@/config/site";
import { getCatalog, getProductBySlug, getProductsBySlugs, getRelatedProducts, toSummary } from "@/lib/catalog";
import { getCategory, getOccasion, getRecipient } from "@/lib/catalog/taxonomy";
import { formatMoney } from "@/lib/format";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductGrid } from "@/components/product/ProductCard";
import { PurchasePanel } from "@/components/product/PurchasePanel";
import { SafeImage } from "@/components/product/SafeImage";
import { Breadcrumbs, SampleNotice } from "@/components/shop/ShopView";
import { Badge, SectionHeading } from "@/components/ui/primitives";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Product not found" };
  const image = product.images[0];
  return {
    title: product.name,
    description: `${product.shortDescription} ${formatMoney(product.price)} at Realmsgifts.`,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description: product.shortDescription,
      images: image?.src.startsWith("https://images.unsplash.com/")
        ? [{ url: `${image.src}?auto=format&fit=crop&w=1200&h=630&q=75`, alt: image.alt }]
        : undefined,
    },
  };
}

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group border-b border-line" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-base font-medium text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown size={18} className="text-muted transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="pb-6 text-[15px] leading-relaxed text-muted">{children}</div>
    </details>
  );
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();

  const category = getCategory(product.category);
  const [related, bundleItems] = await Promise.all([
    getRelatedProducts(product),
    product.bundleItems ? getProductsBySlugs(product.bundleItems) : Promise.resolve([]),
  ]);
  const catalog = await getCatalog();
  const partOfBundles = catalog.filter((p) => p.bundleItems?.includes(product.slug)).slice(0, 2);
  const onSale = product.compareAtPrice !== undefined && product.compareAtPrice > product.price;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    category: category?.name,
    image: product.images.filter((i) => i.src.startsWith("http")).map((i) => `${i.src}?auto=format&fit=crop&w=1200&q=75`),
    offers: {
      "@type": "Offer",
      url: `${SITE.url}/product/${product.slug}`,
      priceCurrency: product.currency,
      price: product.price.toFixed(2),
      ...(product.stock !== null && {
        availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      }),
    },
  };

  return (
    <div className="container-page py-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, String.raw`\u003c`) }} />
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/shop", label: "Shop" },
          ...(category ? [{ href: `/shop/${category.slug}`, label: category.name }] : []),
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={product.images} name={product.name} />

        <div className="lg:sticky lg:top-36 lg:self-start">
          {category && (
            <Link href={`/shop/${category.slug}`} className="eyebrow text-forest hover:underline">
              {category.name}
            </Link>
          )}
          <h1 className="mt-3 text-4xl leading-tight text-ink sm:text-[2.75rem]">{product.name}</h1>
          <div className="mt-4 flex items-baseline gap-3">
            <p className="text-2xl font-semibold text-ink">{formatMoney(product.price, product.currency)}</p>
            {onSale && (
              <>
                <p className="text-lg text-muted line-through">
                  <span className="sr-only">Was </span>
                  {formatMoney(product.compareAtPrice!, product.currency)}
                </p>
                <Badge tone="sale">Sale</Badge>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-muted">
            {product.stock === null ? "Available to order" : product.stock > 0 ? (product.stock <= 5 ? `Only ${product.stock} left` : "In stock") : "Out of stock"}
          </p>
          <p className="mt-5 text-[17px] leading-relaxed text-muted">{product.shortDescription}</p>

          {bundleItems.length > 0 && (
            <div className="mt-6 rounded-2xl bg-cream/60 p-5">
              <p className="text-sm font-semibold text-ink">This bundle includes</p>
              <ul className="mt-3 space-y-3">
                {bundleItems.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/product/${item.slug}`} className="flex items-center gap-3 hover:text-forest">
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cream">
                        <SafeImage src={item.images[0]?.src ?? ""} alt="" fill sizes="48px" className="object-cover" />
                      </span>
                      <span className="flex-1 text-sm text-ink">{item.name}</span>
                      <span className="text-sm text-muted">{formatMoney(item.price)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted">Bundle price is the total of the items above. Item options use our standard selections.</p>
            </div>
          )}

          <div className="mt-8">
            <PurchasePanel
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                currency: product.currency,
                images: product.images.slice(0, 1),
                options: product.options,
                personalization: product.personalization,
                stock: product.stock,
                sameDayEligible: product.sameDayEligible,
                giftWrap: product.giftWrap,
              }}
            />
          </div>

          <div className="mt-6">
            <SampleNotice />
          </div>

          <div className="mt-8 border-t border-line">
            <Accordion title="Description" defaultOpen>
              <p>{product.description}</p>
              {(product.occasions.length > 0 || product.recipients.length > 0) && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {product.occasions.slice(0, 4).map((slug) => (
                    <li key={slug}>
                      <Link href={`/occasion/${slug}`} className="inline-block rounded-full bg-white px-3 py-1 text-xs text-ink ring-1 ring-line hover:text-forest">
                        {getOccasion(slug)?.name}
                      </Link>
                    </li>
                  ))}
                  {product.recipients.slice(0, 3).map((slug) => (
                    <li key={slug}>
                      <Link href={`/gifts-for-${slug}`} className="inline-block rounded-full bg-white px-3 py-1 text-xs text-ink ring-1 ring-line hover:text-forest">
                        For {getRecipient(slug)?.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Accordion>
            {(product.details?.length || product.care) && (
              <Accordion title="Details & care">
                <dl className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-4 gap-y-2">
                  <dt className="font-medium text-ink">SKU</dt>
                  <dd>{product.sku}</dd>
                  {product.details?.map((detail) => (
                    <div key={detail.label} className="contents">
                      <dt className="font-medium text-ink">{detail.label}</dt>
                      <dd>{detail.value}</dd>
                    </div>
                  ))}
                  {product.care && (
                    <>
                      <dt className="font-medium text-ink">Care</dt>
                      <dd>{product.care}</dd>
                    </>
                  )}
                </dl>
              </Accordion>
            )}
            <Accordion title="Delivery">
              <p>
                We currently deliver to {AVAILABLE_DESTINATIONS.map((d) => d.name).join(" and ")}. Your delivery options, prices and
                estimated dates are shown at checkout based on the recipient&apos;s address.
                {!DELIVERY_RATES_CONFIRMED && " We'll confirm the delivery date by email after you order."}
              </p>
              <Link href="/delivery" className="mt-3 inline-block font-medium text-forest hover:underline">Delivery information →</Link>
            </Accordion>
            <Accordion title="Returns">
              <p>
                Because many gifts are personalized or perishable, returns depend on the item. If something isn&apos;t right, contact us
                and we&apos;ll make it right.
              </p>
              <Link href="/returns" className="mt-3 inline-block font-medium text-forest hover:underline">Returns policy →</Link>
            </Accordion>
            <Accordion title="Reviews">
              <p>There are no reviews for this item yet. Customer reviews are coming soon.</p>
            </Accordion>
          </div>
        </div>
      </div>

      {partOfBundles.length > 0 && (
        <aside className="mt-16 rounded-3xl bg-cream/60 p-6 sm:p-8">
          <p className="text-sm text-muted">Also available as part of</p>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
            {partOfBundles.map((bundle) => (
              <li key={bundle.slug}>
                <Link href={`/product/${bundle.slug}`} className="font-serif text-xl text-forest hover:underline">
                  {bundle.name} →
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}

      {related.length > 0 && (
        <section className="mt-20">
          <SectionHeading eyebrow="You may also like" title="Pairs beautifully with" />
          <ProductGrid products={related.map(toSummary)} />
        </section>
      )}
    </div>
  );
}