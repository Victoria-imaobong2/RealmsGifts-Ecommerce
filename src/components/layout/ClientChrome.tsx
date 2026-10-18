"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Info, MessageCircle, Sparkles, Truck, X } from "lucide-react";
import { SITE } from "@/config/site";
import { cn } from "@/lib/cn";
import { useUiStore } from "@/store/useUiStore";
import { useWishlistStore } from "@/store/useWishlistStore";

/** Top Announcement Banner for Same-Day Delivery */
export function DeliveryBanner() {
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  // Hide on admin or checkout pages
  if (dismissed || pathname.startsWith("/checkout") || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="bg-forest text-ivory relative z-30 flex items-center justify-between px-4 py-2 text-xs font-medium shadow-sm transition-all">
      <div className="mx-auto flex items-center justify-center gap-2 text-center">
        <div className="flex shrink-0 items-center gap-1.5 text-amber-300">
          <Sparkles size={13} className="animate-pulse" />
          <Truck size={14} />
        </div>
        <span>
          Order before 12 PM for <strong className="font-semibold text-amber-200">Same-Day Delivery</strong> in select areas!
        </span>
        <Link
          href="/delivery"
          className="ml-1 hidden shrink-0 text-amber-200 underline underline-offset-2 hover:text-white sm:inline"
        >
          Learn more
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="rounded-md p-1 text-ivory/70 transition hover:bg-white/10 hover:text-ivory"
        aria-label="Dismiss banner"
      >
        <X size={14} />
      </button>
    </div>
  );
}

/** Floating WhatsApp support. Hidden when no number is configured and on checkout. */
export function SupportButton() {
  const pathname = usePathname();
  if (
    !SITE.whatsappNumber ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/delivery/pod")
  ) {
    return null;
  }

  const href = `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(
    "Hi Realmsgifts! I have a question about a gift.",
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30 flex h-12 items-center gap-2 rounded-full bg-forest px-4 text-sm font-semibold text-ivory shadow-[var(--shadow-lift)] transition hover:bg-forest-dark sm:right-6"
      aria-label="Chat with us on WhatsApp (opens in a new tab)"
    >
      <MessageCircle size={20} aria-hidden />
      <span className="hidden sm:inline">Chat with us</span>
    </a>
  );
}

/** Toast notifications with auto-dismissal after 4 seconds */
export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      dismiss(toasts[0].id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toasts, dismiss]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            "pointer-events-auto flex animate-fade-up items-center gap-3 rounded-full py-2.5 pl-4 pr-2 text-sm shadow-[var(--shadow-lift)]",
            toast.tone === "error" ? "bg-sale text-white" : "bg-forest text-ivory",
          )}
        >
          {toast.tone === "info" ? <Info size={16} aria-hidden /> : <CheckCircle2 size={16} aria-hidden />}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10"
            aria-label="Dismiss"
          >
            <X size={14} aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * When a customer is signed in, merge this device's wishlist into their
 * account and keep subsequent changes in sync. Guests keep a local wishlist.
 */
export function WishlistSync() {
  const replace = useWishlistStore((s) => s.replace);
  const setSynced = useWishlistStore((s) => s.setSynced);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) return;
        const me = await authRes.json();
        if (!me?.user || cancelled) return;

        const local = useWishlistStore.getState().slugs;
        if (local.length) {
          await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slugs: local }),
          });
        }

        const wishlistRes = await fetch("/api/wishlist");
        if (!wishlistRes.ok) return;
        const server = await wishlistRes.json();

        if (cancelled || !Array.isArray(server.slugs)) return;
        replace(server.slugs);
        setSynced(true);
      } catch {
        // Offline or signed out: the local wishlist still works smoothly.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [replace, setSynced]);

  return null;
}