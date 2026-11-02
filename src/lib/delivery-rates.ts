import type { DeliveryRateEntry } from "@/config/delivery";
import { isDatabaseConfigured, prisma } from "@/lib/db";

/**
 * Admin-set delivery fees. Falls back to the built-in prices (an empty list)
 * if the database or the table is unavailable, so checkout never breaks.
 */
export async function getDeliveryRates(): Promise<DeliveryRateEntry[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await prisma.deliveryRate.findMany();
    return rows.map(({ destination, methodId, price, currency, ngnRate }) => ({ destination, methodId, price, currency, ngnRate }));
  } catch (error) {
    console.error("[delivery] Rates unavailable, using built-in prices:", error instanceof Error ? error.message : error);
    return [];
  }
}
