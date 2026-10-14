"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/hooks";
import { useUiStore } from "@/store/useUiStore";
import { useWishlistStore } from "@/store/useWishlistStore";

export function WishlistButton({
  slug,
  name,
  className,
  variant = "overlay",
}: {
  slug: string;
  name: string;
  className?: string;
  variant?: "overlay" | "inline";
}) {
  const hydrated = useHydrated();
  const active = useWishlistStore((s) => s.slugs.includes(slug)) && hydrated;
  const toggle = useWishlistStore((s) => s.toggle);
  const toast = useUiStore((s) => s.toast);
  const [pulse, setPulse] = useState(0);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const added = toggle(slug);
        setPulse((n) => n + 1);
        toast(added ? "Saved to your wishlist" : "Removed from your wishlist", "info");
      }}
      className={cn(
        "flex items-center justify-center transition",
        variant === "overlay"
          ? "h-10 w-10 rounded-full bg-white/90 text-ink shadow-sm backdrop-blur hover:bg-white"
          : "h-12 w-12 rounded-full border border-line bg-white text-ink hover:border-forest",
        className,
      )}
    >
      <Heart
        key={pulse}
        size={18}
        strokeWidth={1.8}
        aria-hidden
        className={cn(pulse > 0 && "animate-pop", active ? "fill-sale text-sale" : "")}
      />
    </button>
  );
}
