/**
 * DELIVERY CONFIGURATION — the single source of truth for where Realmsgifts
 * delivers, how, and at what price. Both the storefront and the checkout API
 * read from here, so the server always re-validates what the browser shows.
 *
 * ⚠️  The rates and timeframes below are STARTER VALUES. They must be
 * confirmed against real carrier/florist contracts before launch. Until then
 * `DELIVERY_RATES_CONFIRMED` stays false and the storefront labels every
 * delivery date as an estimate to be confirmed by email.
 */

export const DELIVERY_RATES_CONFIRMED = false;

/** Flat gift-wrap fee per order, in USD. */
export const GIFT_WRAP_FEE = 4.99;

export type DeliveryMethodId = "standard" | "express" | "same-day" | "scheduled";

export interface DeliveryMethod {
  id: DeliveryMethodId;
  label: string;
  description: string;
  price: number;
  /** Business days from order to earliest / latest arrival. */
  minDays: number;
  maxDays: number;
  /** Same-day only: local cutoff hour (24h) in the destination time zone. */
  cutoffHour?: number;
  /** Same-day only: region codes where it is offered. */
  regions?: string[];
}

export type AddressFormat = "US" | "GENERIC";

export interface Destination {
  code: string;
  name: string;
  flag: string;
  status: "available" | "coming-soon";
  addressFormat: AddressFormat;
  timeZone: string;
  regionLabel: string;
  postalLabel: string;
  postalRequired: boolean;
  regions?: { code: string; name: string }[];
  methods: DeliveryMethod[];
}

const US_STATES: [string, string][] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"],
  ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"],
  ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"],
  ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"],
  ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"],
  ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
];

const toRegions = (list: [string, string][]) => list.map(([code, name]) => ({ code, name }));

export const DESTINATIONS: Destination[] = [
  {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    status: "available",
    addressFormat: "US",
    timeZone: "America/New_York",
    regionLabel: "State",
    postalLabel: "ZIP Code",
    postalRequired: true,
    regions: toRegions(US_STATES),
    methods: [
      { id: "standard", label: "Standard Delivery", description: "Tracked delivery to their door.", price: 8.99, minDays: 3, maxDays: 5 },
      { id: "express", label: "Express Delivery", description: "Priority handling and faster delivery.", price: 19.99, minDays: 1, maxDays: 2 },
      { id: "scheduled", label: "Scheduled Delivery", description: "Choose the day it arrives.", price: 12.99, minDays: 5, maxDays: 5 },
    ],
  },
  { code: "CA", name: "Canada", flag: "🇨🇦", status: "coming-soon", addressFormat: "GENERIC", timeZone: "America/Toronto", regionLabel: "Province", postalLabel: "Postal code", postalRequired: true, methods: [] },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", status: "coming-soon", addressFormat: "GENERIC", timeZone: "Europe/London", regionLabel: "County", postalLabel: "Postcode", postalRequired: true, methods: [] },
];

export const DEFAULT_DESTINATION = "US";

export function getDestination(code: string | undefined): Destination | undefined {
  return DESTINATIONS.find((d) => d.code === code);
}

export const AVAILABLE_DESTINATIONS = DESTINATIONS.filter((d) => d.status === "available");

export function destinationSupportsSameDay(code: string): boolean {
  return Boolean(getDestination(code)?.methods.some((m) => m.id === "same-day"));
}

/** Current hour and weekday in a given time zone. */
function zonedNow(timeZone: string, now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  return { hour, weekend: weekday === "Sat" || weekday === "Sun" };
}

export interface MethodAvailability {
  method: DeliveryMethod;
  available: boolean;
  reason?: string;
}

/**
 * Which delivery methods apply to a destination/region for a given cart.
 * Methods that exist but can't be used are returned with a reason so the UI
 * can explain why (e.g. same-day after the cutoff). Same-day is supported by
 * the engine but not currently offered: add a "same-day" method with `regions`
 * and `cutoffHour` to a destination to enable it.
 */
export function getMethodAvailability(
  destinationCode: string,
  region: string | undefined,
  items: { sameDayEligible: boolean }[],
  now = new Date(),
): MethodAvailability[] {
  const destination = getDestination(destinationCode);
  if (!destination || destination.status !== "available") return [];
  return destination.methods.map((method) => {
    if (method.id !== "same-day") return { method, available: true };
    if (!items.every((item) => item.sameDayEligible)) {
      return { method, available: false, reason: "Same-day delivery isn't available for every item in your order." };
    }
    if (method.regions && (!region || !method.regions.includes(region))) {
      const names = method.regions
        .map((code) => destination.regions?.find((r) => r.code === code)?.name ?? code)
        .join(", ");
      return { method, available: false, reason: `Same-day delivery is currently available in ${names} only.` };
    }
    const { hour, weekend } = zonedNow(destination.timeZone, now);
    if (weekend || (method.cutoffHour !== undefined && hour >= method.cutoffHour)) {
      return { method, available: false, reason: "Today's same-day cutoff has passed. Choose express or scheduled delivery." };
    }
    return { method, available: true };
  });
}

/** Adds business days (Mon–Fri) to a date. */
export function addBusinessDays(from: Date, days: number): Date {
  const date = new Date(from);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return date;
}

export function estimateArrival(method: DeliveryMethod, now = new Date()) {
  return {
    earliest: addBusinessDays(now, method.minDays),
    latest: addBusinessDays(now, method.maxDays),
  };
}

/** Earliest date (YYYY-MM-DD) a scheduled delivery can be booked for. */
export function earliestScheduledDate(method: DeliveryMethod, now = new Date()): string {
  return addBusinessDays(now, method.minDays).toISOString().slice(0, 10);
}
