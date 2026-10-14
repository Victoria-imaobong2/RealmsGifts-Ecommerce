import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, PackageSearch } from "lucide-react";
import { SITE } from "@/config/site";
import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Questions about a gift, an order or partnering with Realmsgifts? Here's how to reach us.",
  alternates: { canonical: "/contact" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ContactPage({ searchParams }: Props) {
  const { topic } = await searchParams;
  const partner = topic === "partner";
  const channels = [
    SITE.whatsappNumber && {
      icon: MessageCircle,
      title: "Chat on WhatsApp",
      text: "The fastest way to reach our team.",
      href: `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(partner ? "Hi Realmsgifts! I'd like to talk about partnering." : "Hi Realmsgifts! I have a question.")}`,
      cta: "Start a chat",
      external: true,
    },
    SITE.supportEmail && {
      icon: Mail,
      title: "Email us",
      text: SITE.supportEmail,
      href: `mailto:${SITE.supportEmail}${partner ? "?subject=Partnership%20inquiry" : ""}`,
      cta: "Send an email",
      external: false,
    },
  ].filter(Boolean) as { icon: typeof Mail; title: string; text: string; href: string; cta: string; external: boolean }[];

  return (
    <InfoPage
      eyebrow={partner ? "Partner with us" : "Contact"}
      title={partner ? "Let's create something lovely together." : "We're here to help."}
      intro={partner ? "We work with florists, bakers, makers and brands who care about craft. Tell us a little about what you make." : "Questions about a gift, delivery or an order? Reach out and a real person will get back to you."}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {channels.map(({ icon: Icon, title, text, href, cta, external }) => (
          <a key={title} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="group rounded-3xl border border-line bg-white p-6 no-underline transition hover:border-forest hover:no-underline">
            <Icon size={24} className="text-forest" aria-hidden />
            <p className="mt-4 font-serif text-xl text-ink">{title}</p>
            <p className="mt-1 text-sm text-muted">{text}</p>
            <p className="mt-4 text-sm font-semibold text-forest">{cta} →</p>
          </a>
        ))}
        <Link href="/track-order" className="rounded-3xl border border-line bg-white p-6 no-underline transition hover:border-forest hover:no-underline">
          <PackageSearch size={24} className="text-forest" aria-hidden />
          <p className="mt-4 font-serif text-xl text-ink">Track an order</p>
          <p className="mt-1 text-sm text-muted">Use your order number and email to see progress.</p>
          <p className="mt-4 text-sm font-semibold text-forest">Track order →</p>
        </Link>
      </div>
      {channels.length === 0 && (
        <p>Our contact channels are being set up. In the meantime, you can track an existing order above.</p>
      )}
      <p className="text-sm">
        When contacting us about an order, please include your order number (it starts with “RG-”). We&apos;ll never ask for your card details.
      </p>
    </InfoPage>
  );
}
