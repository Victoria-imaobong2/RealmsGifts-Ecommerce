import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface WishlistState {
  slugs: string[];
  /** True once the signed-in user's server wishlist has been merged in. */
  syncedWithAccount: boolean;
  toggle: (slug: string) => boolean;
  remove: (slug: string) => void;
  replace: (slugs: string[]) => void;
  setSynced: (synced: boolean) => void;
}

const syncToServer = (method: "POST" | "DELETE", slug: string) => {
  const url = method === "DELETE" ? `/api/wishlist?slug=${encodeURIComponent(slug)}` : "/api/wishlist";
  fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "POST" ? JSON.stringify({ slugs: [slug] }) : undefined,
  }).catch(() => undefined);
};

/**
 * Guests keep a wishlist on this device. Signed-in customers also persist it
 * to their account (see WishlistSync), so it follows them across devices.
 */
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      slugs: [],
      syncedWithAccount: false,
      toggle: (slug) => {
        const has = get().slugs.includes(slug);
        set({ slugs: has ? get().slugs.filter((s) => s !== slug) : [slug, ...get().slugs] });
        if (get().syncedWithAccount) syncToServer(has ? "DELETE" : "POST", slug);
        return !has;
      },
      remove: (slug) => {
        set({ slugs: get().slugs.filter((s) => s !== slug) });
        if (get().syncedWithAccount) syncToServer("DELETE", slug);
      },
      replace: (slugs) => set({ slugs }),
      setSynced: (syncedWithAccount) => set({ syncedWithAccount }),
    }),
    {
      name: "rg-wishlist",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ slugs: state.slugs }),
    },
  ),
);
