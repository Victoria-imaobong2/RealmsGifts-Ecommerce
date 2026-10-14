/** Shared by the checkout form and the checkout API so both agree. */

/** Accepts common formats like "(555) 123-4567", "+1 555 123 4567", "+44 20 7946 0958". */
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return /^[+\d\s().-]{7,25}$/.test(value.trim()) && digits.length >= 7 && digits.length <= 15;
}

export const isValidUsZip = (value: string) => /^\d{5}(-\d{4})?$/.test(value.trim());
