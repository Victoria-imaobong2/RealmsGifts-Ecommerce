"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { CheckCircle2, Info, MessageCircle, X } from "lucide-react";
import { SITE } from "@/config/site";
import { cn } from "@/lib/cn";
import { useUiStore } from "@/store/useUiStore";
import { useWishlistStore } from "@/store/useWishlistStore";

/** Floating WhatsApp support. Hidden when no number is configured and on checkout. */
export function SupportButton() {
  const pathname = usePathname();
  if (!SITE.whatsappNumber || pathname.startsWith("/checkout") || pathname.startsWith("/admin") || pathname.startsWith("/delivery/pod")) return null;
  const href = `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent("Hi Realmsgifts! I have a question about a gift.")}`;
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

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex flex-col items-center gap-2 px-4">
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
          <button type="button" onClick={() => dismiss(toast.id)} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10" aria-label="Dismiss">
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
        const me = await fetch("/api/auth/me").then((r) => r.json());
        if (!me.user || cancelled) return;
        const local = useWishlistStore.getState().slugs;
        if (local.length) {
          await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slugs: local }),
          });
        }
        const server = await fetch("/api/wishlist").then((r) => r.json());
        if (cancelled || !Array.isArray(server.slugs)) return;
        replace(server.slugs);
        setSynced(true);
      } catch {
        // Offline or signed out: the local wishlist still works.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [replace, setSynced]);

  return null;
}
