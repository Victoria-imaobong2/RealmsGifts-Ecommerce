import { NextResponse } from "next/server";
import { getDeliveryRates } from "@/lib/delivery-rates";

/** Public: the storefront overlays these admin-set fees on the built-in delivery options. */
export async function GET() {
  const rates = await getDeliveryRates();
  return NextResponse.json(rates, { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" } });
}
