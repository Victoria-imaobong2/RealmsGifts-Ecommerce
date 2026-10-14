import type { Metadata } from "next";
import { DELIVERY_RATES_CONFIRMED, DESTINATIONS, GIFT_WRAP_FEE, destinationSupportsSameDay } from "@/config/delivery";
import { formatMoney } from "@/lib/format";
import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Delivery Information",
  description: "Where Realmsgifts delivers, delivery options and prices, and how express and scheduled delivery work.",
  alternates: { canonical: "/delivery" },
};

export default function DeliveryPage() {
  return (
    <InfoPage
      eyebrow="Delivery"
      title="Delivery information"
      intro="Every option and price below comes straight from the same settings our checkout uses, so what you see here is what you'll see when you order."
    >
      {!DELIVERY_RATES_CONFIRMED && (
        <p className="rounded-xl bg-cream/70 px-4 py-3 text-sm">
          Delivery timeframes are estimates while we finalize our carrier partnerships. We confirm your delivery date by email after you order.
        </p>
      )}
      {DESTINATIONS.map((destination) => (
        <section key={destination.code}>
          <h2>
            {destination.name}
          </h2>
          {destination.status !== "available" ? (
            <p>Coming soon — we don&apos;t deliver here yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-line bg-white">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="border-b border-line bg-cream/50 text-ink">
                  <tr>
                    <th scope="col" className="p-3 font-medium">Option</th>
                    <th scope="col" className="p-3 font-medium">Estimated time</th>
                    <th scope="col" className="p-3 font-medium">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {destination.methods.map((method) => (
                    <tr key={method.id}>
                      <td className="p-3 text-ink">{method.label}</td>
                      <td className="p-3">
                        {method.id === "same-day"
                          ? `Same day, ordered before ${method.cutoffHour! % 12 || 12} ${method.cutoffHour! >= 12 ? "PM" : "AM"} local time (weekdays)${method.regions ? `; ${method.regions.map((code) => destination.regions?.find((r) => r.code === code)?.name ?? code).join(", ")} only` : ""}`
                          : method.id === "scheduled"
                            ? `Choose a date ${method.minDays}+ business days ahead`
                            : `${method.minDays}–${method.maxDays} business days`}
                      </td>
                      <td className="p-3 text-ink">{formatMoney(method.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
      <section>
        <h2>Gift wrapping & messages</h2>
        <p>Add a personal message to any order at no charge. Signature gift wrapping is {formatMoney(GIFT_WRAP_FEE)} per order. You can also choose to hide prices from the recipient.</p>
      </section>
      {DESTINATIONS.some((d) => destinationSupportsSameDay(d.code)) && (
      <section>
          <h2>Same-day eligible items</h2>
          <p>Same-day delivery is available for locally prepared gifts such as flowers, cakes, treats and hampers. If any item in your bag isn&apos;t eligible, checkout will let you know.</p>
        </section>
      )}
    </InfoPage>
  );
}
