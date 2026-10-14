import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="eyebrow text-forest">Page not found</p>
      <h1 className="mt-3 text-4xl text-ink sm:text-5xl">This page has wandered off.</h1>
      <p className="mt-4 max-w-md text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back to finding something lovely.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/shop">Shop gifts</ButtonLink>
        <ButtonLink href="/" variant="secondary">Go home</ButtonLink>
      </div>
      <Link href="/track-order" className="mt-6 text-sm text-forest hover:underline">Looking for an order? Track it here →</Link>
    </div>
  );
}
