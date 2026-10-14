import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MAX_QUANTITY } from "@/lib/pricing";

export interface CartItem {
  /** Unique per product + chosen options + personalization. */
  lineId: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  options: Record<string, string>;
  personalization?: string;
  quantity: number;
  sameDayEligible: boolean;
}

export type NewCartItem = Omit<CartItem, "lineId" | "quantity"> & { quantity?: number };

interface CartState {
  items: CartItem[];
  /** Line id of the most recently added item, used for subtle feedback. */
  lastAdded: string | null;
  addItem: (item: NewCartItem) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
}

export function lineIdFor(item: Pick<CartItem, "slug" | "options" | "personalization">): string {
  const options = Object.entries(item.options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return `${item.slug}|${options}|${item.personalization ?? ""}`;
}

const clampQuantity = (quantity: number) => Math.min(MAX_QUANTITY, Math.max(1, Math.round(quantity)));

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      lastAdded: null,
      addItem: (newItem) =>
        set((state) => {
          const lineId = lineIdFor(newItem);
          const quantity = newItem.quantity ?? 1;
          const existing = state.items.find((i) => i.lineId === lineId);
          if (existing) {
            return {
              lastAdded: lineId,
              items: state.items.map((i) =>
                i.lineId === lineId ? { ...i, quantity: clampQuantity(i.quantity + quantity) } : i,
              ),
            };
          }
          return {
            lastAdded: lineId,
            items: [...state.items, { ...newItem, lineId, quantity: clampQuantity(quantity) }],
          };
        }),
      updateQuantity: (lineId, quantity) =>
        set((state) => ({
          items: state.items.map((i) => (i.lineId === lineId ? { ...i, quantity: clampQuantity(quantity) } : i)),
        })),
      removeItem: (lineId) => set((state) => ({ items: state.items.filter((i) => i.lineId !== lineId) })),
      clearCart: () => set({ items: [], lastAdded: null }),
    }),
    {
      name: "rg-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((sum, item) => sum + item.quantity, 0);
export const cartSubtotal = (items: CartItem[]) =>
  Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
