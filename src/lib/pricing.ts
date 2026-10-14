import { GIFT_WRAP_FEE } from "@/config/delivery";
import { roundMoney } from "@/lib/format";

export interface OrderTotals {
  subtotal: number;
  shipping: number;
  giftWrap: number;
  /** Sales tax isn't calculated yet — kept explicit so it's never silently implied. */
  tax: null;
  total: number;
}

/** Shared by the checkout page (display) and the checkout API (authoritative). */
export function computeTotals(subtotal: number, shipping: number, giftWrap: boolean): OrderTotals {
  const wrap = giftWrap ? GIFT_WRAP_FEE : 0;
  return {
    subtotal: roundMoney(subtotal),
    shipping: roundMoney(shipping),
    giftWrap: wrap,
    tax: null,
    total: roundMoney(subtotal + shipping + wrap),
  };
}

export const MAX_QUANTITY = 20;
