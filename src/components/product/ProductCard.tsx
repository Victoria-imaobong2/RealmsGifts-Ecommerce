import Link from "next/link";
import { getCategory } from "@/lib/catalog/taxonomy";
import type { ProductSummary } from "@/lib/catalog/types";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { Badge } from "@/components/ui/primitives";
import { QuickAddButton } from "./QuickAddButton";
import { SafeImage } from "./SafeImage";
import { WishlistButton } from "./WishlistButton";

function availabilityLabel(stock: number | null) {
  if (stock === null) return { text: "Available to order", tone: "text-muted" };
  if (stock <= 0) return { text: "Out of stock", tone: "text-sale" };
  if (stock <= 5) return { text: `Only ${stock} left`, tone: "text-sale" };
  return { text: "In stock", tone: "text-success" };
}

interface ProductCardProps {
  product: ProductSummary;
  priority?: boolean;
  className?: string;
}

interface ProductGridProps {
  products: ProductSummary[];
  className?: string;
  priorityCount?: number;
}

export function ProductCard({
  product,
  priority = false,
  className,
}: Readonly<ProductCardProps>) {
  const image = product.images[0];
  const hoverImage = product.images[1];
  const category = getCategory(product.category);
  const availability = availabilityLabel(product.stock);
  const onSale = product.compareAtPrice !== undefined && product.compareAtPrice > product.price;

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="zoom-media relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream">
        <Link href={`/product/${product.slug}`} className="absolute inset-0" tabIndex={-1} aria-hidden>
          {image && (
            <SafeImage
              src={image.src}
              alt=""
              fill
              sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw"
              className="object-cover"
              loading={priority ? "eager" : "lazy"}
            />
          )}
          {hoverImage && (
            <SafeImage
              src={hoverImage.src}
              alt=""
              fill
              sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw"
              className="object-cover opacity-0 transition-opacity duration-300 [@media(hover:hover)]:group-hover:opacity-100"
            />
          )}
        </Link>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.bundleItems && <Badge tone="gold">Bundle</Badge>}
          {onSale && <Badge tone="sale">Sale</Badge>}
        </div>
        <WishlistButton slug={product.slug} name={product.name} className="absolute right-3 top-3 z-10" />
      </div>

      <div className="flex flex-1 flex-col pt-3">
        {category && <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{category.name}</p>}
        <h3 className="mt-1 font-sans text-[15px] font-medium leading-snug text-ink">
          <Link href={`/product/${product.slug}`} className="after:absolute after:inset-0 after:content-[''] hover:text-forest focus-visible:outline-none">
            {product.name}
          </Link>
          {image && <span className="sr-only">. {image.alt}</span>}
        </h3>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[15px] font-semibold text-ink">{formatMoney(product.price, product.currency)}</span>
          {onSale && (
            <span className="text-sm text-muted line-through">
              <span className="sr-only">Was </span>
              {formatMoney(product.compareAtPrice!, product.currency)}
            </span>
          )}
        </div>
        <p className={cn("mt-1 text-xs", availability.tone)}>{availability.text}</p>
        <div className="relative z-10 mt-auto pt-3">
          <QuickAddButton product={product} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  className,
  priorityCount = 0,
}: Readonly<ProductGridProps>) {
  return (
    <ul className={cn("grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6", className)}>
      {products.map((product, index) => (
        <li key={product.slug} className="flex">
          <ProductCard product={product} priority={index < priorityCount} className="w-full" />
        </li>
      ))}
    </ul>
  );
}