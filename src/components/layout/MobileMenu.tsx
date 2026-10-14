"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronRight, Heart, MessageCircle, User, X } from "lucide-react";
import { MAIN_NAV } from "@/config/site";
import { CATEGORIES, OCCASIONS } from "@/lib/catalog/taxonomy";
import { useDialog } from "@/lib/hooks";
import { useUiStore } from "@/store/useUiStore";

export function MobileMenu() {
  const open = useUiStore((s) => s.panel === "menu");
  const close = useUiStore((s) => s.close);
  const panelRef = useRef<HTMLDivElement>(null);
  useDialog(open, close, panelRef);

  if (!open) return null;

  const link = "flex items-center justify-between py-3.5 text-[17px] text-ink";

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 animate-fade-in bg-forest-dark/40" onClick={close} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="absolute inset-y-0 left-0 flex w-[min(88vw,380px)] animate-slide-in-left flex-col bg-ivory shadow-[var(--shadow-overlay)]"
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <span className="font-serif text-lg tracking-[0.16em] text-forest">REALMSGIFTS</span>
          <button type="button" onClick={close} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-cream" aria-label="Close menu">
            <X size={22} aria-hidden />
          </button>
        </div>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-2">
          <ul className="divide-y divide-line">
            {MAIN_NAV.filter((i) => i.href !== "/categories" && i.href !== "/occasions").map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={link} onClick={close}>
                  {item.label}
                  <ChevronRight size={18} className="text-muted" aria-hidden />
                </Link>
              </li>
            ))}
            <li>
              <details className="group">
                <summary className={`${link} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
                  Categories
                  <ChevronRight size={18} className="text-muted transition group-open:rotate-90" aria-hidden />
                </summary>
                <ul className="pb-3 pl-3">
                  {CATEGORIES.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/shop/${c.slug}`} onClick={close} className="block py-2 text-[15px] text-muted hover:text-forest">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
            <li>
              <details className="group">
                <summary className={`${link} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
                  Occasions
                  <ChevronRight size={18} className="text-muted transition group-open:rotate-90" aria-hidden />
                </summary>
                <ul className="pb-3 pl-3">
                  {OCCASIONS.map((o) => (
                    <li key={o.slug}>
                      <Link href={`/occasion/${o.slug}`} onClick={close} className="block py-2 text-[15px] text-muted hover:text-forest">
                        {o.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
            <li>
              <Link href="/contact" className={link} onClick={close}>
                Contact
                <ChevronRight size={18} className="text-muted" aria-hidden />
              </Link>
            </li>
          </ul>
        </nav>

        <div className="grid grid-cols-3 gap-2 border-t border-line p-4 text-xs font-medium">
          <Link href="/account" onClick={close} className="flex flex-col items-center gap-1.5 rounded-xl bg-white py-3 text-ink">
            <User size={20} aria-hidden /> Account
          </Link>
          <Link href="/wishlist" onClick={close} className="flex flex-col items-center gap-1.5 rounded-xl bg-white py-3 text-ink">
            <Heart size={20} aria-hidden /> Wishlist
          </Link>
          <Link href="/contact" onClick={close} className="flex flex-col items-center gap-1.5 rounded-xl bg-white py-3 text-ink">
            <MessageCircle size={20} aria-hidden /> Help
          </Link>
        </div>
      </div>
    </div>
  );
}
