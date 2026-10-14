import Image from "next/image";
import Link from "next/link";
import {
  Gift,
  HeartHandshake,
  Lock,
  MapPinned,
  MessageSquareHeart,
  PackageCheck,
  PenLine,
  Search,
  Sparkles,
  Truck,
} from "lucide-react";
import { AVAILABLE_DESTINATIONS, DESTINATIONS } from "@/config/delivery";
import { SITE } from "@/config/site";
import { ButtonLink } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/primitives";
import { DestinationSelector } from "./DestinationSelector";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-ivory">
      <div className="container-page grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1fr_1.05fr] lg:gap-16 lg:py-20">
        <div className="max-w-xl motion-safe:animate-fade-up">
          <p className="eyebrow text-forest">Gifting, beautifully done</p>
          <h1 className="mt-4 text-[2.6rem] leading-[1.05] text-ink sm:text-6xl lg:text-[4.25rem]">
            Thoughtful gifts.
            <span className="block italic text-forest">Wherever they are.</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted">
            Discover beautiful gifts for birthdays, anniversaries, celebrations, and all the little moments that deserve
            something special.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/shop" size="lg">
              Shop gifts
            </ButtonLink>
            <ButtonLink href="/occasions" size="lg" variant="secondary">
              Shop by occasion
            </ButtonLink>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <li className="flex items-center gap-2"><Lock size={15} className="text-forest" aria-hidden /> Secure checkout</li>
            <li className="flex items-center gap-2"><PenLine size={15} className="text-forest" aria-hidden /> Personal gift messages</li>
            <li className="flex items-center gap-2"><PackageCheck size={15} className="text-forest" aria-hidden /> Order tracking</li>
          </ul>
        </div>

        <div className="relative motion-safe:animate-fade-in">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-cream sm:aspect-[5/4] lg:aspect-[4/5]">
            <Image
              src="https://images.unsplash.com/photo-1608824405605-88c9d2c847e8"
              alt="Gifts wrapped in copper paper beside a bouquet of fresh flowers"
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-5 left-4 hidden max-w-[16rem] items-center gap-3 rounded-2xl bg-white p-3 pr-5 shadow-[var(--shadow-lift)] sm:flex lg:-left-8 lg:bottom-10">
            <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream">
              <Image src="https://images.unsplash.com/photo-1625552186152-668cd2f0b707" alt="" fill sizes="56px" className="object-cover" />
            </span>
            <span className="text-sm leading-snug">
              <span className="block font-medium text-ink">Add your own message</span>
              <span className="text-muted">Handwritten-style cards on every order</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function InternationalBand() {
  return (
    <section id="destination" className="bg-cream/60 py-16 sm:py-20">
      <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <div>
          <p className="eyebrow text-forest">Across town or across the world</p>
          <h2 className="mt-3 text-3xl leading-tight text-ink sm:text-4xl">Wherever they are, make the moment count.</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Shopping from the US? Send a thoughtful gift to someone you love, whether they&apos;re nearby or miles away.
            Pay in dollars — we&apos;ll handle the rest.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Delivery destinations">
            {DESTINATIONS.map((d) => (
              <li
                key={d.code}
                className={
                  d.status === "available"
                    ? "rounded-full bg-white px-4 py-2 text-sm font-medium text-ink ring-1 ring-line"
                    : "rounded-full px-4 py-2 text-sm text-muted border border-dashed border-line"
                }
              >
                {d.name}
                {d.status === "coming-soon" && <span className="ml-1 text-xs">· soon</span>}
              </li>
            ))}
          </ul>
        </div>
        <DestinationSelector />
      </div>
    </section>
  );
}

export function DeliveryHighlights() {
  const items = [
    { icon: Lock, title: "Secure checkout", text: "Payments processed securely by Paystack." },
    { icon: MessageSquareHeart, title: "Your message, included", text: "Add a personal note to every gift." },
    {
      icon: Truck,
      title: AVAILABLE_DESTINATIONS.length === 1 ? `Delivering across the ${AVAILABLE_DESTINATIONS[0].name}` : `Delivering in ${AVAILABLE_DESTINATIONS.length} countries`,
      text: "Clear delivery options and prices for every address, with more destinations coming.",
    },
    { icon: PackageCheck, title: "Track every order", text: "Follow your gift from our hands to theirs." },
  ];
  return (
    <section aria-label="Why shoppers choose us" className="border-y border-line bg-white">
      <ul className="container-page grid grid-cols-2 gap-x-6 gap-y-6 py-8 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3">
            <Icon size={22} strokeWidth={1.6} className="mt-0.5 shrink-0 text-forest" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted sm:text-sm">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { icon: Search, title: "Choose something they'll love.", text: "Browse by occasion, recipient or budget — or let our gift finder help." },
    { icon: PenLine, title: "Add their details and your message.", text: "Tell us where it's going and what you'd like to say." },
    { icon: Truck, title: "Choose an available delivery option.", text: "We'll only show options available for their address." },
    { icon: PackageCheck, title: "Track your order until it arrives.", text: "Follow every step with your order number." },
  ];
  return (
    <section className="py-16 sm:py-24">
      <div className="container-page">
        <SectionHeading eyebrow="How it works" title="Giving is easy." align="center" />
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="reveal relative rounded-3xl border border-line bg-white p-6">
              <span className="font-serif text-4xl text-gold">{String(index + 1).padStart(2, "0")}</span>
              <Icon size={22} strokeWidth={1.6} className="absolute right-6 top-7 text-forest" aria-hidden />
              <h3 className="mt-4 text-xl leading-snug text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function WhyRealmsgifts() {
  const reasons = [
    { icon: Lock, title: "Secure checkout", text: "Card payments are handled by Paystack. We never see or store your card details." },
    { icon: MapPinned, title: "Clear delivery information", text: "See delivery options and prices for their address before you pay." },
    { icon: Gift, title: "Personalized gifting", text: "Gift messages, engraving and gift wrap on eligible items." },
    { icon: PackageCheck, title: "Order tracking", text: "Look up your order anytime with your order number and email." },
    { icon: HeartHandshake, title: "Responsive support", text: SITE.whatsappNumber ? "Questions? Chat with our team on WhatsApp." : "Questions? Our team is a message away." },
    { icon: Sparkles, title: "Carefully curated", text: "A considered edit of gifts, chosen for how they make people feel." },
  ];
  return (
    <section className="on-dark bg-forest py-16 text-ivory sm:py-24">
      <div className="container-page">
        <div className="mb-12 max-w-2xl">
          <p className="eyebrow text-gold">Why Realmsgifts</p>
          <h2 className="mt-3 text-3xl leading-tight sm:text-4xl">Why shop with Realmsgifts?</h2>
        </div>
        <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map(({ icon: Icon, title, text }) => (
            <li key={title} className="reveal flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ivory/10 text-gold">
                <Icon size={20} strokeWidth={1.6} aria-hidden />
              </span>
              <div>
                <h3 className="font-sans text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ivory/75">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest underline-offset-4 hover:underline">
      {children} <span aria-hidden>→</span>
    </Link>
  );
}
