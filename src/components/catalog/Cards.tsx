import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Category, Occasion, Recipient } from "@/lib/catalog/taxonomy";
import { cn } from "@/lib/cn";

const cardBase =
  "group relative block overflow-hidden rounded-2xl bg-cream shadow-[var(--shadow-card)] transition duration-300 ease-out hover:shadow-[var(--shadow-lift)] focus-visible:shadow-[var(--shadow-lift)]";

export function CategoryCard({ category, count, className }: { category: Category; count?: number; className?: string }) {
  return (
    <Link href={`/shop/${category.slug}`} className={cn(cardBase, "zoom-media", className)}>
      <div className="relative aspect-[4/5]">
        <Image src={category.image.src} alt="" fill sizes="(min-width: 1024px) 23vw, (min-width: 640px) 31vw, 70vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/85 via-forest-dark/20 to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5 text-ivory">
        <h3 className="text-xl leading-tight transition duration-300 group-hover:-translate-y-0.5">{category.name}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-ivory/80">{category.description}</p>
        <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em]">
          {count !== undefined && count > 0 ? `${count} gift${count === 1 ? "" : "s"}` : "Shop now"}
          <ArrowRight size={14} aria-hidden className="transition duration-300 group-hover:translate-x-1" />
        </p>
      </div>
    </Link>
  );
}

export function OccasionCard({ occasion, className }: { occasion: Occasion; className?: string }) {
  return (
    <Link href={`/occasion/${occasion.slug}`} className={cn(cardBase, "zoom-media", className)}>
      <div className="relative aspect-[3/4]">
        <Image src={occasion.image.src} alt="" fill sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 60vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 via-transparent to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4 text-ivory">
        <h3 className="text-lg leading-tight">{occasion.name}</h3>
        <p className="mt-1 line-clamp-2 text-[13px] text-ivory/80">{occasion.description}</p>
      </div>
    </Link>
  );
}

export function RecipientCard({ recipient, className }: { recipient: Recipient; className?: string }) {
  return (
    <Link href={`/gifts-for-${recipient.slug}`} className={cn("group flex flex-col items-center text-center", className)}>
      <span className="zoom-media relative block aspect-square w-full overflow-hidden rounded-full bg-cream ring-1 ring-line transition duration-300 group-hover:ring-4 group-hover:ring-gold/40">
        <Image src={recipient.image.src} alt="" fill sizes="(min-width: 1024px) 12vw, 28vw" className="object-cover" />
      </span>
      <span className="mt-3 font-serif text-lg text-ink transition group-hover:text-forest">{recipient.name}</span>
    </Link>
  );
}

/** Horizontal scroller on small screens, grid from `md` up. */
export function Rail({ children, className, label }: { children: React.ReactNode; className?: string; label: string }) {
  return (
    <ul
      aria-label={label}
      className={cn(
        "scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:overflow-visible md:px-0",
        className,
      )}
    >
      {children}
    </ul>
  );
}
