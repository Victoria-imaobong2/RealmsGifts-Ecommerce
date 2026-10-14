"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { MAIN_NAV } from "@/config/site";
import { CATEGORIES, OCCASIONS } from "@/lib/catalog/taxonomy";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/hooks";
import { cartCount, useCartStore } from "@/store/useCartStore";
import { useUiStore } from "@/store/useUiStore";
import { useWishlistStore } from "@/store/useWishlistStore";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group flex flex-col items-center leading-none", className)} aria-label="Realmsgifts — home">
      <span className="whitespace-nowrap font-serif text-[15px] tracking-[0.12em] text-forest min-[375px]:text-lg min-[375px]:tracking-[0.16em] sm:text-2xl sm:tracking-[0.18em]">REALMSGIFTS</span>
      <span className="mt-1 hidden text-[9px] font-medium uppercase tracking-[0.32em] text-muted sm:block">Thoughtful gifts</span>
    </Link>
  );
}

function CountBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-forest px-1 text-[10px] font-bold text-ivory ring-2 ring-ivory">
      {count > 99 ? "99+" : count}
      <span className="sr-only"> {label}</span>
    </span>
  );
}

const iconButton =
  "relative flex h-11 w-10 items-center justify-center rounded-full text-ink transition hover:bg-cream sm:w-11";

function MegaMenu({ label, href, items, columns }: { label: string; href: string; items: { href: string; label: string }[]; columns: number }) {
  return (
    // Positioned against the full-width nav bar (not this item) so it never runs off-screen.
    <div className="group">
      <Link
        href={href}
        className="flex items-center gap-1 py-3 text-[13px] font-medium tracking-wide text-ink transition hover:text-forest"
        aria-haspopup="true"
      >
        {label}
        <ChevronDown size={14} aria-hidden className="transition group-hover:rotate-180 group-focus-within:rotate-180" />
      </Link>
      <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 translate-y-1 pt-2 opacity-0 transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <ul
          className="grid gap-x-8 gap-y-1 rounded-2xl border border-line bg-white p-6 shadow-[var(--shadow-overlay)]"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(11rem, 1fr))` }}
        >
          {items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block rounded-lg px-2 py-1.5 text-sm text-ink hover:bg-cream hover:text-forest">
                {item.label}
              </Link>
            </li>
          ))}
          <li className="col-span-full mt-2 border-t border-line pt-3">
            <Link href={href} className="px-2 text-sm font-semibold text-forest hover:underline">
              View all {label.toLowerCase()} →
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const wishlistCount = useWishlistStore((s) => s.slugs.length);
  const open = useUiStore((s) => s.open);
  const bagCount = hydrated ? cartCount(items) : 0;
  const savedCount = hydrated ? wishlistCount : 0;

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory/95 backdrop-blur supports-[backdrop-filter]:bg-ivory/85">
      <div className="container-page grid h-16 grid-cols-[1fr_auto_1fr] items-center sm:h-[72px]">
        {/* Left: mobile menu + desktop search */}
        <div className="flex items-center gap-1">
          <button type="button" className={cn(iconButton, "lg:hidden")} aria-label="Open menu" onClick={() => open("menu")}>
            <Menu size={22} strokeWidth={1.6} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => open("search")}
            className="hidden h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm text-muted transition hover:border-forest/40 lg:flex lg:w-56"
          >
            <Search size={16} aria-hidden />
            <span>Search gifts</span>
          </button>
        </div>

        <Logo />

        {/* Right: actions */}
        <div className="flex items-center justify-end gap-0.5">
          <button type="button" className={cn(iconButton, "lg:hidden")} aria-label="Search" onClick={() => open("search")}>
            <Search size={21} strokeWidth={1.6} aria-hidden />
          </button>
          <Link href="/wishlist" className={cn(iconButton, "hidden sm:flex")} aria-label="Wishlist">
            <Heart size={21} strokeWidth={1.6} aria-hidden />
            <CountBadge count={savedCount} label="saved items" />
          </Link>
          <Link href="/account" className={cn(iconButton, "hidden sm:flex")} aria-label="Account">
            <User size={21} strokeWidth={1.6} aria-hidden />
          </Link>
          <button type="button" className={iconButton} aria-label={`Shopping bag, ${bagCount} item${bagCount === 1 ? "" : "s"}`} onClick={() => open("cart")}>
            <ShoppingBag size={21} strokeWidth={1.6} aria-hidden />
            <CountBadge count={bagCount} label="items in bag" />
          </button>
        </div>
      </div>

      {/* Desktop navigation */}
      <nav aria-label="Main" className="hidden border-t border-line/70 lg:block">
        <ul className="container-page relative flex items-center justify-center gap-9">
          <li>
            <Link href="/" className={cn("block py-3 text-[13px] font-medium tracking-wide transition hover:text-forest", pathname === "/" ? "text-forest" : "text-ink")}>
              Home
            </Link>
          </li>
          {MAIN_NAV.map((item) => (
            <li key={item.href}>
              {item.href === "/categories" ? (
                <MegaMenu label="Categories" href="/categories" columns={3} items={CATEGORIES.map((c) => ({ href: `/shop/${c.slug}`, label: c.name }))} />
              ) : item.href === "/occasions" ? (
                <MegaMenu label="Occasions" href="/occasions" columns={3} items={OCCASIONS.map((o) => ({ href: `/occasion/${o.slug}`, label: o.name }))} />
              ) : (
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "block py-3 text-[13px] font-medium tracking-wide transition hover:text-forest",
                    isActive(item.href) ? "text-forest" : "text-ink",
                  )}
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
