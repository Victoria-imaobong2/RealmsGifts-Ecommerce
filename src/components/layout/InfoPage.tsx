import { Breadcrumbs } from "@/components/shop/ShopView";

export function InfoPage({
  eyebrow,
  title,
  intro,
  children,
  draft = false,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
  /** Marks policy pages that still need the business's final, reviewed wording. */
  draft?: boolean;
}) {
  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: eyebrow }]} />
      <header className="mt-5">
        <p className="eyebrow text-forest">{eyebrow}</p>
        <h1 className="mt-2 text-4xl leading-tight text-ink sm:text-5xl">{title}</h1>
        {intro && <p className="mt-4 text-lg leading-relaxed text-muted">{intro}</p>}
      </header>
      {draft && (
        <p className="mt-6 rounded-xl bg-gold-soft/70 px-4 py-3 text-sm text-forest-dark">
          This policy is being finalized. If you have a question before it&apos;s published, please contact us.
        </p>
      )}
      <div className="mt-10 space-y-8 text-[16px] leading-relaxed text-muted [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:text-ink [&_strong]:text-ink [&_a]:font-medium [&_a]:text-forest [&_a:hover]:underline [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}
