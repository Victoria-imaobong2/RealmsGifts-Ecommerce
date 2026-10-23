/**
 * DELIVERY CONFIGURATION — RealmsGifts
 * Single source of truth for delivery options, regions, and rules.
 */

export const DELIVERY_RATES_CONFIRMED = true;

/** Flat gift-wrap fee per order in NGN. */
export const GIFT_WRAP_FEE = 5000;

export type DeliveryMethodId = "standard" | "express" | "same-day" | "scheduled";

export interface DeliveryMethod {
  id: DeliveryMethodId;
  label: string;
  description: string;
  price: number;
  minDays: number;
  maxDays: number;
  cutoffHour?: number;
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

const COMMON_METHODS: DeliveryMethod[] = [
  { id: "standard", label: "Standard Delivery", description: "Standard tracked doorstep delivery.", price: 0, minDays: 3, maxDays: 5 },
  { id: "express", label: "Express Shipping", description: "Fast-track priority shipping via DHL / FedEx.", price: 5000, minDays: 1, maxDays: 3 },
  { id: "same-day", label: "Same-Day Delivery", description: "Order before 12 PM for local delivery today.", price: 15000, minDays: 0, maxDays: 0, cutoffHour: 14 },
  { id: "scheduled", label: "Scheduled Delivery", description: "Choose a specific delivery date.", price: 3000, minDays: 1, maxDays: 1 },
];

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

const NG_STATES: [string, string][] = [
  ["AB", "Abia"], ["AD", "Adamawa"], ["AK", "Akwa Ibom"], ["AN", "Anambra"],
  ["BA", "Bauchi"], ["BY", "Bayelsa"], ["BE", "Benue"], ["BO", "Borno"],
  ["CR", "Cross River"], ["DE", "Delta"], ["EB", "Ebonyi"], ["ED", "Edo"],
  ["EK", "Ekiti"], ["EN", "Enugu"], ["FC", "Federal Capital Territory (Abuja)"],
  ["GO", "Gombe"], ["IM", "Imo"], ["JI", "Jigawa"], ["KD", "Kaduna"],
  ["KN", "Kano"], ["KT", "Katsina"], ["KE", "Kebbi"], ["KO", "Kogi"],
  ["KW", "Kwara"], ["LA", "Lagos"], ["NA", "Nasarawa"], ["NI", "Niger"],
  ["OG", "Ogun"], ["ON", "Ondo"], ["OS", "Osun"], ["OY", "Oyo"],
  ["PL", "Plateau"], ["RI", "Rivers"], ["SO", "Sokoto"], ["TA", "Taraba"],
  ["YO", "Yobe"], ["ZA", "Zamfara"]
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
    methods: COMMON_METHODS,
  },
  {
    code: "NG",
    name: "Nigeria",
    flag: "🇳🇬",
    status: "available",
    addressFormat: "GENERIC",
    timeZone: "Africa/Lagos",
    regionLabel: "State",
    postalLabel: "Postal Code",
    postalRequired: false,
    regions: toRegions(NG_STATES),
    methods: COMMON_METHODS,
  },
  {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    status: "available",
    addressFormat: "GENERIC",
    timeZone: "America/Toronto",
    regionLabel: "Province",
    postalLabel: "Postal code",
    postalRequired: true,
    methods: COMMON_METHODS,
  },
  {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    status: "available",
    addressFormat: "GENERIC",
    timeZone: "Europe/London",
    regionLabel: "County",
    postalLabel: "Postcode",
    postalRequired: true,
    methods: COMMON_METHODS,
  },
  {
    code: "EU",
    name: "Europe",
    flag: "🇪🇺",
    status: "available",
    addressFormat: "GENERIC",
    timeZone: "Europe/Paris",
    regionLabel: "Region / Country",
    postalLabel: "Postal Code",
    postalRequired: true,
    methods: COMMON_METHODS,
  },
  {
    code: "AU",
    name: "Australia",
    flag: "🇦🇺",
    status: "available",
    addressFormat: "GENERIC",
    timeZone: "Australia/Sydney",
    regionLabel: "State / Territory",
    postalLabel: "Postcode",
    postalRequired: true,
    methods: COMMON_METHODS,
  },
];

export const DEFAULT_DESTINATION = "US";

export function getDestination(code: string | undefined): Destination | undefined {
  if (!code) return DESTINATIONS.find((d) => d.code === DEFAULT_DESTINATION);
  return DESTINATIONS.find((d) => d.code === code);
}

export const AVAILABLE_DESTINATIONS = DESTINATIONS.filter((d) => d.status === "available");

export function destinationSupportsSameDay(code: string): boolean {
  return Boolean(getDestination(code)?.methods.some((m) => m.id === "same-day"));
}

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
    const { hour, weekend } = zonedNow(destination.timeZone, now);
    if (weekend || (method.cutoffHour !== undefined && hour >= method.cutoffHour)) {
      return { method, available: false, reason: "Today's same-day cutoff has passed." };
    }
    return { method, available: true };
  });
}

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

export function earliestScheduledDate(method: DeliveryMethod, now = new Date()): string {
  return addBusinessDays(now, method.minDays).toISOString().slice(0, 10);
}