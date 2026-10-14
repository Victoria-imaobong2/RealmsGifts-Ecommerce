import Link from "next/link";
import { Lock } from "lucide-react";
import { SITE } from "@/config/site";
import { NewsletterForm } from "@/components/home/NewsletterForm";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All Gifts" },
      { href: "/shop?sort=newest", label: "New Arrivals" },
      { href: "/shop?sort=featured", label: "Featured" },
      { href: "/shop/gift-boxes", label: "Gift Boxes" },
      { href: "/shop/personalized", label: "Personalized Gifts" },
    ],
  },
  {
    title: "Shop by",
    links: [
      { href: "/occasions", label: "Occasion" },
      { href: "/recipients", label: "Recipient" },
      { href: "/shop?budget=under-25", label: "Budget" },
      { href: "/gift-finder", label: "Gift Finder" },
    ],
  },
  {
    title: "Customer care",
    links: [
      { href: "/track-order", label: "Track Order" },
      { href: "/delivery", label: "Delivery" },
      { href: "/returns", label: "Returns" },
      { href: "/faq", label: "FAQs" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about", label: "Our Story" },
      { href: "/contact?topic=partner", label: "Become a Partner" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

const SOCIAL_LABELS: Record<keyof typeof SITE.social, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  pinterest: "Pinterest",
};

export function Footer() {
  const socials = (Object.keys(SITE.social) as (keyof typeof SITE.social)[]).filter((key) => SITE.social[key]);

  return (
    <footer className="on-dark bg-forest-dark text-ivory">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.2fr_2fr] lg:gap-16">
        <div>
          <p className="font-serif text-2xl tracking-[0.16em]">REALMSGIFTS</p>
          <p className="mt-3 max-w-sm font-serif text-lg italic text-ivory/80">{SITE.tagline}</p>
          <div className="mt-8 max-w-sm">
            <p className="text-sm font-semibold">Gift ideas, delivered to your inbox</p>
            <p className="mt-1 text-sm text-ivory/70">New collections and seasonal favorites. No spam, unsubscribe anytime.</p>
            <NewsletterForm tone="dark" className="mt-4" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="eyebrow mb-4 text-gold">{column.title}</p>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-ivory/80 transition hover:text-ivory">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="container-page flex flex-col gap-4 py-6 text-xs text-ivory/70 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Realmsgifts. All prices in USD.</p>
          <p className="flex items-center gap-2">
            <Lock size={14} aria-hidden /> Secure checkout powered by Paystack
          </p>
          {socials.length > 0 && (
            <ul className="flex gap-5" aria-label="Social media">
              {socials.map((key) => (
                <li key={key}>
                  <a href={SITE.social[key]} target="_blank" rel="noopener noreferrer" className="hover:text-ivory">
                    {SOCIAL_LABELS[key]}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
