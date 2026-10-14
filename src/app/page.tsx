import Link from "next/link";
import { getCatalog, toSummary } from "@/lib/catalog";
import { sortProducts } from "@/lib/catalog/query";
import { BUDGETS, CATEGORIES, OCCASIONS, RECIPIENTS, isOccasionInSeason } from "@/lib/catalog/taxonomy";
import { CategoryCard, OccasionCard, Rail, RecipientCard } from "@/components/catalog/Cards";
import { GiftFinder } from "@/components/home/GiftFinder";
import { DeliveryHighlights, Hero, HowItWorks, InternationalBand, SectionLink, WhyRealmsgifts } from "@/components/home/Sections";
import { BundleCard } from "@/components/product/BundleCard";
import { ProductGrid } from "@/components/product/ProductCard";
import { SectionHeading } from "@/components/ui/primitives";

export const metadata = { alternates: { canonical: "/" } };

// Re-render at most every 10 minutes so seasonal occasions and admin-added products stay fresh.
export const revalidate = 600;

export default async function HomePage() {
  const catalog = await getCatalog();
  const counts = new Map<string, number>();
  for (const product of catalog) counts.set(product.category, (counts.get(product.category) ?? 0) + 1);

  // Editorial order for the homepage; falls back to other featured items if any are missing.
  const editorsOrder = [
    "classic-red-rose-bouquet", "pendant-necklace", "self-care-gift-box", "classic-analog-watch",
    "classic-chocolate-cake", "scented-candle-set", "premium-chocolate-box", "luxury-birthday-hamper",
  ];
  const featured = [
    ...editorsOrder.map((slug) => catalog.find((p) => p.slug === slug)).filter((p) => p !== undefined),
    ...sortProducts(catalog.filter((p) => p.featured && !p.bundleItems && !editorsOrder.includes(p.slug)), "featured"),
  ].slice(0, 8);
  const bundles = catalog.filter((p) => p.bundleItems).slice(0, 3);
  const bySlug = new Map(catalog.map((p) => [p.slug, p]));
  const occasions = OCCASIONS.filter((o) => isOccasionInSeason(o)).slice(0, 10);

  return (
    <>
      <Hero />
      <InternationalBand />
      <DeliveryHighlights />

      <section className="py-16 sm:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Shop by category"
            title="Find something they'll love."
            action={<SectionLink href="/categories">All categories</SectionLink>}
          />
          <Rail label="Gift categories" className="md:grid-cols-3 lg:grid-cols-4">
            {CATEGORIES.slice(0, 8).map((category) => (
              <li key={category.slug} className="reveal w-[68vw] shrink-0 snap-start sm:w-[42vw] md:w-auto">
                <CategoryCard category={category} count={counts.get(category.slug)} />
              </li>
            ))}
          </Rail>
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="More categories">
            {CATEGORIES.slice(8).map((category) => (
              <li key={category.slug}>
                <Link href={`/shop/${category.slug}`} className="inline-block rounded-full border border-line bg-white px-4 py-2 text-sm text-ink transition hover:border-forest hover:text-forest">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Shop by occasion" title="For every moment worth celebrating." action={<SectionLink href="/occasions">All occasions</SectionLink>} />
          <Rail label="Occasions" className="md:grid-cols-5">
            {occasions.map((occasion) => (
              <li key={occasion.slug} className="reveal w-[56vw] shrink-0 snap-start sm:w-[34vw] md:w-auto">
                <OccasionCard occasion={occasion} />
              </li>
            ))}
          </Rail>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Editor's picks" title="Featured gifts" description="A few of the pieces we keep coming back to." action={<SectionLink href="/shop">Shop all gifts</SectionLink>} />
          <ProductGrid products={featured.map(toSummary)} />
        </div>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Gift bundles" title="Thoughtfully put together." description="Curated sets of our favorites — every item listed, priced exactly as the sum of its parts." action={<SectionLink href="/shop?type=bundle">All bundles</SectionLink>} />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bundles.map((bundle) => (
              <div key={bundle.slug} className="reveal flex">
                <BundleCard bundle={bundle} items={(bundle.bundleItems ?? []).map((slug) => bySlug.get(slug)!).filter(Boolean)} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Shop by recipient" title="Who are you shopping for?" align="center" />
          <ul className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11">
            {RECIPIENTS.map((recipient) => (
              <li key={recipient.slug} className="reveal">
                <RecipientCard recipient={recipient} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Shop by budget" title="Gifts for every budget." align="center" />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {BUDGETS.map((budget) => (
              <li key={budget.slug}>
                <Link
                  href={`/shop?budget=${budget.slug}`}
                  className="group flex h-24 flex-col items-center justify-center rounded-2xl border border-line bg-white transition duration-200 hover:border-forest hover:bg-forest hover:text-ivory"
                >
                  <span className="font-serif text-2xl">{budget.label}</span>
                  <span className="mt-1 text-xs text-muted transition group-hover:text-ivory/80">Shop now →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-16 sm:py-24" aria-labelledby="finder-heading">
        <div className="container-page">
          <div className="mb-8 text-center">
            <p className="eyebrow text-forest">Gift finder</p>
            <h2 id="finder-heading" className="mt-3 text-3xl text-ink sm:text-4xl">Not sure what to get?</h2>
            <p className="mt-3 text-muted">Answer three quick questions and we&apos;ll suggest a few ideas.</p>
          </div>
          <GiftFinder />
        </div>
      </section>

      <HowItWorks />
      <WhyRealmsgifts />
    </>
  );
}
