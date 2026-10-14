import type { Metadata } from "next";
import { GiftFinder } from "@/components/home/GiftFinder";
import { Breadcrumbs } from "@/components/shop/ShopView";

export const metadata: Metadata = {
  title: "Gift Finder",
  description: "Not sure what to get? Answer three quick questions and we'll suggest gifts they'll love.",
  alternates: { canonical: "/gift-finder" },
};

export default function GiftFinderPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Gift finder" }]} />
      <div className="mx-auto mt-8 max-w-4xl text-center">
        <p className="eyebrow text-forest">Gift finder</p>
        <h1 className="mt-3 text-4xl text-ink sm:text-5xl">Not sure what to get?</h1>
        <p className="mt-3 text-muted">Tell us a little about them and we&apos;ll narrow things down.</p>
      </div>
      <div className="mx-auto mt-10 max-w-5xl">
        <GiftFinder />
      </div>
    </div>
  );
}
