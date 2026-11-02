"use client";

import { useEffect, useState } from "react";
import type { DeliveryRateEntry } from "@/config/delivery";

let cached: DeliveryRateEntry[] = [];

/** Admin-set delivery fees for client components; built-in prices apply until they load. */
export function useDeliveryRates(): DeliveryRateEntry[] {
  const [rates, setRates] = useState<DeliveryRateEntry[]>(cached);

  useEffect(() => {
    let ignore = false;
    fetch("/api/delivery-rates")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: DeliveryRateEntry[] | null) => {
        if (ignore || !Array.isArray(data)) return;
        cached = data;
        setRates(data);
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, []);

  return rates;
}
