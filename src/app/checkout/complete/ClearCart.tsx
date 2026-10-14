"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";

/** Empties the bag once the server has confirmed payment. */
export function ClearCart() {
  const clearCart = useCartStore((s) => s.clearCart);
  useEffect(() => {
    clearCart();
  }, [clearCart]);
  return null;
}
