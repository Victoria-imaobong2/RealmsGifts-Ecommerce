import Link from "next/link";
import { Check } from "lucide-react";
import type { Product } from "@/lib/catalog/types";
import { formatMoney } from "@/lib/format";
import { QuickAddButton } from "./QuickAddButton";
import { SafeImage } from "./SafeImage";
import { WishlistButton } from "./WishlistButton";

/** Shows a bundle as a mosaic of its real items, with each item listed. */
export function BundleCard({ bundle, items }: { bundle: Product; items: Product[] }) {
  const tiles = items.slice(0, 4);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-[var(--shadow-card)] transition duration-300 hover:shadow-[var(--shadow-lift)]">
      <div className="relative grid aspect-[4/3] grid-cols-2 gap-0.5 bg-line">
        {tiles.map((item, index) => (
          <div key={item.slug} className={`zoom-media relative overflow-hidden bg-cream ${tiles.length === 3 && index === 0 ? "row-span-2" : ""}`}>
            <SafeImage src={item.images[0]?.src ?? ""} alt="" fill sizes="(min-width: 1024px) 16vw, 45vw" className="object-cover" />
          </div>
        ))}
        <WishlistButton slug={bundle.slug} name={bundle.name} className="absolute right-3 top-3 z-10" />
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="text-2xl leading-tight text-ink">
          <Link href={`/product/${bundle.slug}`} className="after:absolute after:inset-0 after:content-[''] hover:text-forest">
            {bundle.name}
          </Link>
        </h3>
        <p className="mt-1.5 text-sm text-muted">{bundle.shortDescription}</p>
        <ul className="mt-4 space-y-1.5 text-sm text-ink" aria-label="Included in this bundle">
          {items.map((item) => (
            <li key={item.slug} className="flex items-center gap-2">
              <Check size={14} className="shrink-0 text-forest" aria-hidden /> {item.name}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-end justify-between gap-4 pt-5">
          <div>
            <p className="text-xs text-muted">Bundle price</p>
            <p className="text-xl font-semibold text-ink">{formatMoney(bundle.price, bundle.currency)}</p>
          </div>
          <div className="relative z-10 w-40">
            <QuickAddButton
              product={{
                id: bundle.id,
                slug: bundle.slug,
                name: bundle.name,
                price: bundle.price,
                currency: bundle.currency,
                category: bundle.category,
                images: bundle.images,
                stock: bundle.stock,
                sameDayEligible: bundle.sameDayEligible,
                addedAt: bundle.addedAt,
              }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
