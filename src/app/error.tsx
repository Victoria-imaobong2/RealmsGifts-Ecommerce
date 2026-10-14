"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="eyebrow text-forest">Something went wrong</p>
      <h1 className="mt-3 text-4xl text-ink">We couldn&apos;t load this page.</h1>
      <p className="mt-4 max-w-md text-muted">Please try again. If it keeps happening, our team would love to know.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="secondary">Go home</ButtonLink>
      </div>
    </div>
  );
}
