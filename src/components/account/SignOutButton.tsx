"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { useWishlistStore } from "@/store/useWishlistStore";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
        // Don't leave the account's wishlist on a shared device.
        useWishlistStore.getState().replace([]);
        useWishlistStore.getState().setSynced(false);
        router.push("/");
        router.refresh();
      }}
      className="flex h-11 items-center gap-2 self-start rounded-full border border-line bg-white px-5 text-sm font-medium text-ink transition hover:border-sale hover:text-sale disabled:opacity-60"
    >
      <LogOut size={16} aria-hidden /> {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
