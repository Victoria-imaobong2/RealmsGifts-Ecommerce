import type { CurrencyCode } from "@/lib/catalog/types";

const moneyFormatters = new Map<string, Intl.NumberFormat>();

/** Formats an amount in major units, e.g. formatMoney(49.99) → "$49.99". */
export function formatMoney(amount: number, currency: CurrencyCode | string = "NGN", locale = "en-NG"): string {
  const key = `${locale}:${currency}`;
  let formatter = moneyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { style: "currency", currency });
    moneyFormatters.set(key, formatter);
  }
  return formatter.format(Number.isFinite(amount) ? amount : 0);
}

export function formatDate(date: Date | string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) {
  return new Intl.DateTimeFormat("en-NG", options).format(typeof date === "string" ? new Date(date) : date);
}

export function formatDateRange(from: Date, to: Date) {
  const opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
  if (from.toDateString() === to.toDateString()) return formatDate(from, opts);
  return `${formatDate(from, opts)} – ${formatDate(to, opts)}`;
}

export const roundMoney = (value: number) => Math.round(value * 100) / 100;
