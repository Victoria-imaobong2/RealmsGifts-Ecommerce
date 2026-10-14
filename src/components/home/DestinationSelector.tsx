"use client";

import { CalendarClock, CheckCircle2, Clock, MapPin, Truck } from "lucide-react";
import {
  DELIVERY_RATES_CONFIRMED,
  DESTINATIONS,
  estimateArrival,
  getDestination,
  type DeliveryMethodId,
} from "@/config/delivery";
import { formatDateRange, formatMoney } from "@/lib/format";
import { useHydrated } from "@/lib/hooks";
import { useDestinationStore } from "@/store/useDestinationStore";
import { Field, Input, Select } from "@/components/ui/primitives";

const METHOD_ICONS: Record<DeliveryMethodId, typeof Truck> = {
  standard: Truck,
  express: Clock,
  "same-day": CheckCircle2,
  scheduled: CalendarClock,
};

export function DestinationSelector() {
  const hydrated = useHydrated();
  const { country, region, postalCode, set } = useDestinationStore();
  const destination = getDestination(hydrated ? country : "US") ?? DESTINATIONS[0];
  const regionName = destination.regions?.find((r) => r.code === region)?.name;

  return (
    <div className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-soft text-forest">
          <MapPin size={18} aria-hidden />
        </span>
        <h3 className="text-2xl text-ink">Where are you sending your gift?</h3>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Field label="Country" htmlFor="dest-country">
          <Select
            id="dest-country"
            value={destination.code}
            onChange={(e) => set({ country: e.target.value, region: "", city: "", postalCode: "" })}
          >
            {DESTINATIONS.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
                {d.status === "coming-soon" ? " (coming soon)" : ""}
              </option>
            ))}
          </Select>
        </Field>
        {destination.status === "available" && destination.regions && (
          <Field label={destination.regionLabel} htmlFor="dest-region" optional>
            <Select id="dest-region" value={region} onChange={(e) => set({ region: e.target.value })}>
              <option value="">Select {destination.regionLabel.toLowerCase()}</option>
              {destination.regions.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {destination.status === "available" && destination.code === "US" && (
          <Field label="ZIP Code" htmlFor="dest-zip" optional>
            <Input
              id="dest-zip"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={10}
              placeholder="10001"
              value={postalCode}
              onChange={(e) => set({ postalCode: e.target.value.replace(/[^\d-]/g, "") })}
            />
          </Field>
        )}
      </div>

      <div className="mt-6" aria-live="polite">
        {destination.status !== "available" ? (
          <div className="rounded-2xl bg-cream/70 p-5">
            <p className="font-medium text-ink">
              We don&apos;t deliver to {destination.name} just yet.
            </p>
            <p className="mt-1 text-sm text-muted">
              We&apos;re working on it. Today we deliver within{" "}
              {DESTINATIONS.filter((d) => d.status === "available").map((d) => d.name).join(" and ")}.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted">
              Delivery options for {regionName ? `${regionName}, ` : ""}
              {destination.name}:
            </p>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {destination.methods.map((method) => {
                const Icon = METHOD_ICONS[method.id];
                const { earliest, latest } = estimateArrival(method);
                const sameDayLimited = method.id === "same-day" && method.regions && region && !method.regions.includes(region);
                return (
                  <li key={method.id} className="flex gap-3 rounded-2xl border border-line p-4">
                    <Icon size={18} className="mt-0.5 shrink-0 text-forest" aria-hidden />
                    <div className="min-w-0 text-sm">
                      <p className="flex flex-wrap items-baseline justify-between gap-x-3 font-medium text-ink">
                        {method.label}
                        <span className="font-semibold">{formatMoney(method.price)}</span>
                      </p>
                      <p className="mt-0.5 text-muted">
                        {sameDayLimited
                          ? "Not available in the selected state."
                          : method.id === "scheduled"
                            ? `Choose a date from ${formatDateRange(earliest, earliest)}`
                            : method.id === "same-day"
                              ? method.description
                              : `Estimated arrival ${formatDateRange(earliest, latest)}`}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            {!DELIVERY_RATES_CONFIRMED && (
              <p className="mt-3 text-xs text-muted">
                Dates are estimates. We&apos;ll confirm your delivery date by email after you order.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
